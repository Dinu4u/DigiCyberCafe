import { FFmpeg } from "@ffmpeg/ffmpeg";
import type {
  VideoCompressorWorkerRequest,
  VideoCompressorWorkerResponse,
} from "@/types/videoCompressor";
import { MAX_VIDEO_FILE_BYTES } from "@/types/videoCompressor";

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<VideoCompressorWorkerRequest>) => void) | null;
  postMessage: (message: VideoCompressorWorkerResponse, transfer?: Transferable[]) => void;
};

const FFMPEG_CORE_VERSION = "0.12.9";
const MAX_SINGLE_ALLOCATION_BYTES = 128 * 1024 * 1024;
const EXECUTION_TIMEOUT_MS = 30 * 60 * 1000;

type ActiveJob = {
  ffmpeg: FFmpeg;
  abortController: AbortController;
  cancelled: boolean;
};

let activeJob: ActiveJob | null = null;

workerScope.onmessage = async ({ data }) => {
  if (data?.type === "cancel") {
    if (activeJob) {
      activeJob.cancelled = true;
      activeJob.abortController.abort();
      activeJob.ffmpeg.terminate();
    } else {
      workerScope.postMessage({ type: "cancelled" });
    }
    return;
  }

  if (data?.type !== "compress") return;
  if (activeJob) {
    workerScope.postMessage({ type: "failure", message: "A video is already being compressed." });
    return;
  }

  const ffmpeg = new FFmpeg();
  const job: ActiveJob = {
    ffmpeg,
    abortController: new AbortController(),
    cancelled: false,
  };
  activeJob = job;

  const inputPath = "/source-video";
  const outputPath = "/compressed-video.mp4";
  let inputWritten = false;
  let outputWritten = false;
  let coreUrl: string | null = null;
  let wasmUrl: string | null = null;
  let outputBuffer: ArrayBuffer | null = null;
  let processingError: unknown;

  const report = (phase: "loading" | "preparing" | "compressing", progress: number, message: string) => {
    if (!job.cancelled) {
      workerScope.postMessage({
        type: "progress",
        progress: {
          phase,
          progress: Math.max(0, Math.min(99, Math.round(progress))),
          message,
        },
      });
    }
  };

  try {
    if (typeof WebAssembly === "undefined" || typeof fetch !== "function") {
      throw new Error("This browser does not support the WebAssembly runtime needed for local video compression.");
    }
    if (!(data.file instanceof File) || data.file.size === 0) {
      throw new Error("Choose a non-empty video file to compress.");
    }
    if (data.file.size > MAX_VIDEO_FILE_BYTES) {
      throw new Error(
        "Your uploaded video exceeds the 120 MB limit. For your privacy, we process videos on your device and do not upload them to the internet. Please choose a video smaller than 120 MB.",
      );
    }
    report("loading", 0, "Loading the FFmpeg video engine…");
    const runtimeBase = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;
    [coreUrl, wasmUrl] = await Promise.all([
      loadRuntimeAsset(`${runtimeBase}/ffmpeg-core.js`, "text/javascript", job.abortController.signal),
      loadRuntimeAsset(`${runtimeBase}/ffmpeg-core.wasm`, "application/wasm", job.abortController.signal),
    ]);
    if (job.cancelled) throw new Error("Compression cancelled.");

    await ffmpeg.load({ coreURL: coreUrl, wasmURL: wasmUrl }, { signal: job.abortController.signal });
    if (job.cancelled) throw new Error("Compression cancelled.");

    report("preparing", 0, "Reading the video locally…");
    const inputBytes = new Uint8Array(await data.file.arrayBuffer());
    if (job.cancelled) throw new Error("Compression cancelled.");
    inputWritten = await ffmpeg.writeFile(inputPath, inputBytes);
    if (!inputWritten) throw new Error("The browser could not prepare this video for compression.");

    const onProgress = ({ progress }: { progress: number }) => {
      if (Number.isFinite(progress)) {
        report("compressing", progress * 100, "Compressing and scaling the video…");
      }
    };
    ffmpeg.on("progress", onProgress);

    const result = await ffmpeg.exec(
      [
        "-hide_banner",
        "-i",
        inputPath,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-map_metadata",
        "0",
        "-vf",
        "scale=-2:trunc(min(ih\\,720)/2)*2",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "28",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-threads",
        "1",
        "-filter_threads",
        "1",
        "-max_alloc",
        String(MAX_SINGLE_ALLOCATION_BYTES),
        "-movflags",
        "+faststart",
        outputPath,
      ],
      EXECUTION_TIMEOUT_MS,
      { signal: job.abortController.signal },
    );
    ffmpeg.off("progress", onProgress);
    if (job.cancelled) throw new Error("Compression cancelled.");
    if (result !== 0) {
      throw new Error("FFmpeg could not encode this video. Try a different supported input file.");
    }

    const outputData = await ffmpeg.readFile(outputPath);
    if (typeof outputData === "string" || outputData.byteLength === 0) {
      throw new Error("FFmpeg produced an empty output file.");
    }
    outputWritten = true;
    await ffmpeg.deleteFile(outputPath);
    outputWritten = false;

    const transferableOutput = new Uint8Array(outputData.byteLength);
    transferableOutput.set(outputData);
    outputBuffer = transferableOutput.buffer;
  } catch (error) {
    if (!job.cancelled) processingError = error;
  } finally {
    try {
      if (!job.cancelled && ffmpeg.loaded) {
        if (outputWritten) await ffmpeg.deleteFile(outputPath);
        if (inputWritten) await ffmpeg.deleteFile(inputPath);
      }
    } catch (error) {
      if (!processingError && !job.cancelled) processingError = error;
      else if (processingError) console.error("FFmpeg temporary-file cleanup failed.", error);
    } finally {
      ffmpeg.terminate();
      if (coreUrl) URL.revokeObjectURL(coreUrl);
      if (wasmUrl) URL.revokeObjectURL(wasmUrl);
      if (activeJob === job) activeJob = null;
    }
  }

  if (job.cancelled) return;
  if (processingError) {
    workerScope.postMessage({
      type: "failure",
      message: processingError instanceof Error
        ? processingError.message
        : "Video compression failed unexpectedly.",
    });
    return;
  }
  if (!outputBuffer) {
    workerScope.postMessage({ type: "failure", message: "FFmpeg did not return a compressed video." });
    return;
  }

  report("compressing", 100, "Video compression is complete.");
  workerScope.postMessage({ type: "success", output: outputBuffer }, [outputBuffer]);
};

async function loadRuntimeAsset(url: string, mimeType: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the FFmpeg runtime (HTTP ${response.status}). Check your connection and try again.`);
  }
  return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: mimeType }));
}

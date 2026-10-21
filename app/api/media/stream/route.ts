import { NextResponse } from "next/server";
import { PassThrough, Readable } from "node:stream";
import { buildYtDlpFormatSelector, classifyProviderError, getMediaErrorDetails, getYtDlpExecutablePath, getYtDlpImageFormats, MediaProviderError, runYtDlp, type YtDlpInfo } from "@/lib/media/ytdlp";
import { validateMediaUrl } from "@/lib/utils/urlValidator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const parameters = new URL(request.url).searchParams;
    const urlValue = parameters.get("url") ?? "";
    const format = parameters.get("format") ?? "";
    const validated = validateMediaUrl(urlValue);
    let selectedFormat = buildYtDlpFormatSelector(format);
    let imagePlaylistIndex = 0;

    if (!validated.valid || validated.platform === "other" || !selectedFormat) {
      return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
    }

    const imageMatch = /^image-(\d{1,2})$/.exec(format);
    if (imageMatch) {
      const rawInfo = await runYtDlp([
        "--dump-single-json",
        "--no-warnings",
        "--skip-download",
        "--playlist-end",
        "12",
        validated.url.toString(),
      ]);
      const info = JSON.parse(rawInfo) as YtDlpInfo;
      const image = getYtDlpImageFormats(info)[Number(imageMatch[1])];
      if (!image) {
        return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
      }
      imagePlaylistIndex = image.entryIndex;
      selectedFormat = {
        selector: image.formatId,
        extension: image.extension,
        postprocess: [],
      };
    }

    const childArgs = [
      "--no-warnings",
      "--no-progress",
      "--socket-timeout",
      "15",
      ...(imagePlaylistIndex > 1 ? ["--playlist-items", String(imagePlaylistIndex)] : ["--no-playlist"]),
      "-f",
      selectedFormat.selector,
      ...selectedFormat.postprocess,
      "-o",
      "-",
      validated.url.toString(),
    ];

    const { spawn } = await import("node:child_process");
    const child = spawn(getYtDlpExecutablePath(), childArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    const output = new PassThrough();
    const timeout = setTimeout(() => {
      child.kill();
      output.destroy(new Error("Media download timed out."));
    }, 30 * 60 * 1000);
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 16_000) stderr += chunk.toString();
    });
    child.stdout.pipe(output);
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        output.destroy(
          new MediaProviderError(
            classifyProviderError(stderr),
            stderr || "The media stream ended unexpectedly.",
          ),
        );
      }
    });
    child.once("error", (error) => output.destroy(error));

    try {
      await waitForFirstChunkOrError(child, output, () => stderr);
    } catch (error) {
      child.kill();
      clearTimeout(timeout);
      const code =
        error instanceof MediaProviderError
          ? error.code
          : "extraction_failed";
      return NextResponse.json(getMediaErrorDetails(code), {
        status: code === "temporary_failure" ? 429 : 422,
      });
    }

    const baseName = `media-download.${selectedFormat.extension}`;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        output.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
          if (controller.desiredSize !== null && controller.desiredSize <= 0) {
            output.pause();
          }
        });
        output.once("end", () => controller.close());
        output.once("error", (error) => controller.error(error));
      },
      pull() {
        output.resume();
      },
      cancel() {
        child.kill();
        output.destroy();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": contentType(selectedFormat.extension, format.startsWith("audio-")),
        "Content-Disposition": `attachment; filename="${baseName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Accel-Buffering": "no",
        "X-Download-Options": "noopen",
      },
    });
  } catch (error) {
    const code =
      error instanceof MediaProviderError
        ? error.code
        : "extraction_failed";
    return NextResponse.json(getMediaErrorDetails(code), {
      status: code === "temporary_failure" ? 429 : 422,
    });
  }

  function waitForFirstChunkOrError(
    child: import("node:child_process").ChildProcessByStdio<
      null,
      Readable,
      Readable
    >,
    output: PassThrough,
    getStderr: () => string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        settle(new MediaProviderError("temporary_failure", "Media provider timed out."));
      }, 45_000);

      const cleanup = () => {
        clearTimeout(timeout);
        output.off("readable", onReadable);
        output.off("error", onError);
        child.off("close", onClose);
      };
      const settle = (error?: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
      };
      const onReadable = () => {
        if (output.readableLength > 0) settle();
      };
      const onError = (error: Error) => settle(error);
      const onClose = (code: number | null) => {
        if (code !== 0 || output.readableLength === 0) {
          settle(
            new MediaProviderError(
              classifyProviderError(getStderr()),
              getStderr() || "The media provider returned an empty stream.",
            ),
          );
        }
      };

      output.on("readable", onReadable);
      output.once("error", onError);
      child.once("close", onClose);
    });
  }
}

function contentType(extension: string, isAudio = false): string {
  const types: Record<string, string> = {
    mp4: "video/mp4",
    webm: isAudio ? "audio/webm" : "video/webm",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    jpg: "image/jpeg",
    png: "image/png",
  };
  return types[extension] ?? "application/octet-stream";
}

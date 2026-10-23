import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildYtDlpFormatSelector, getFfmpegExecutablePath, getMediaErrorDetails, getYtDlpImageFormats, MediaProviderError, runYtDlp, type YtDlpInfo } from "@/lib/media/ytdlp";
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

    const tempDirectory = await mkdtemp(join(tmpdir(), "digicybercafe-media-"));
    let responseOwnsTempDirectory = false;
    try {
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

    const ffmpegPath = getFfmpegExecutablePath();
    if (selectedFormat.postprocess.includes("--merge-output-format") && !ffmpegPath) {
      throw new MediaProviderError("extractor_unavailable", "FFmpeg is not installed on the media server.");
    }

    const childArgs = [
      "--no-warnings",
      "--no-progress",
      "--socket-timeout",
      "15",
      ...(imagePlaylistIndex > 1 ? ["--playlist-items", String(imagePlaylistIndex)] : ["--no-playlist"]),
      ...(ffmpegPath ? ["--ffmpeg-location", ffmpegPath] : []),
      "-f",
      selectedFormat.selector,
      ...selectedFormat.postprocess,
      "-o",
      join(tempDirectory, "download.%(ext)s"),
      validated.url.toString(),
    ];

    await runYtDlp(childArgs, 30 * 60 * 1000);
    const outputPath = join(tempDirectory, `download.${selectedFormat.extension}`);
    const outputFiles = await readdir(tempDirectory);
    if (!outputFiles.includes(`download.${selectedFormat.extension}`)) {
      throw new MediaProviderError("extraction_failed", `yt-dlp produced unexpected output files: ${outputFiles.join(", ") || "none"}.`);
    }
    const outputInfo = await stat(outputPath);
    if (!outputInfo.isFile() || outputInfo.size === 0) {
      throw new MediaProviderError("extraction_failed", "The media provider returned an empty download.");
    }

    const baseName = `media-download.${selectedFormat.extension}`;
    const file = createReadStream(outputPath);
    let cleanupPromise: Promise<void> | undefined;
    const cleanup = () => {
      cleanupPromise ??= rm(tempDirectory, { recursive: true, force: true });
      return cleanupPromise;
    };
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        file.on("data", (chunk: Buffer | string) => {
          const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(bytes));
          if (controller.desiredSize !== null && controller.desiredSize <= 0) {
            file.pause();
          }
        });
        file.once("end", () => {
          controller.close();
          void cleanup();
        });
        file.once("error", (error) => {
          controller.error(error);
          void cleanup();
        });
      },
      pull() {
        file.resume();
      },
      cancel() {
        file.destroy();
        return cleanup();
      },
    });
    responseOwnsTempDirectory = true;
    return new Response(stream, {
      headers: {
        "Content-Type": contentType(selectedFormat.extension, format.startsWith("audio-")),
        "Content-Disposition": `attachment; filename="${baseName}"`,
        "Content-Length": String(outputInfo.size),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Accel-Buffering": "no",
        "X-Download-Options": "noopen",
      },
    });
    } finally {
      if (!responseOwnsTempDirectory) {
        await rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
      }
    }
  } catch (error) {
    const code =
      error instanceof MediaProviderError
        ? error.code
        : "extraction_failed";
    return NextResponse.json(getMediaErrorDetails(code), {
      status:
        code === "extractor_unavailable"
          ? 503
          : code === "temporary_failure"
            ? 429
            : 422,
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

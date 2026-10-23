import { NextResponse } from "next/server";
import { buildMediaFormats, getMediaErrorDetails, getYtDlpImageFormats, MediaProviderError, runYtDlp, type YtDlpInfo } from "@/lib/media/ytdlp";
import { validateMediaUrl } from "@/lib/utils/urlValidator";
import { MEDIA_DOWNLOADER_ENABLED } from "@/lib/media/availability";
import type { MediaExtractionRequest, MediaFormat } from "@/types/mediaDownloader";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!MEDIA_DOWNLOADER_ENABLED) {
    return NextResponse.json({ error: "Media downloads are temporarily unavailable." }, { status: 404 });
  }

  try {
    let body: MediaExtractionRequest;
    try {
      body = (await request.json()) as MediaExtractionRequest;
    } catch {
      return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
    }

    if (typeof body?.url !== "string") {
      return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
    }
    const validated = validateMediaUrl(body.url);
    if (!validated.valid) {
      return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
    }

    if (validated.platform === "other") {
      const directFormat = getDirectMediaFormat(validated.url);
      if (!directFormat) {
        return NextResponse.json(getMediaErrorDetails("invalid_url"), { status: 400 });
      }
      const mediaType = directFormat.formatType === "image"
        ? "image"
        : directFormat.formatType === "audio-only"
          ? "audio"
          : "video";
      const fileName = validated.url.pathname.split("/").pop() || "media file";
      return NextResponse.json(
        {
          title: fileName,
          mediaType,
          sourcePlatform: "other",
          thumbnailUrl: "",
          formats: [directFormat],
          directLink: true,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=300",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    const playlistArgs = validated.platform === "youtube"
      ? ["--no-playlist"]
      : ["--playlist-end", "12"];
    const rawInfo = await runYtDlp([
      "--dump-single-json",
      ...playlistArgs,
      "--no-warnings",
      "--skip-download",
      "--socket-timeout",
      "15",
      validated.url.toString(),
    ]);
    const info = JSON.parse(rawInfo) as YtDlpInfo;
    const formats = buildMediaFormats(info, validated.url.toString());
    if (formats.length === 0) {
      return NextResponse.json(getMediaErrorDetails("extraction_failed"), { status: 422 });
    }
    const imageCount = getYtDlpImageFormats(info).length;
    const onlyImages = formats.every((format) => format.formatType === "image");
    const mediaType = onlyImages
      ? imageCount > 1
        ? "carousel"
        : "image"
      : formats.every((format) => format.formatType === "audio-only")
        ? "audio"
        : "video";

    return NextResponse.json(
      {
        title: info.title?.trim() || "Untitled media",
        mediaType,
        sourcePlatform: validated.platform,
        thumbnailUrl: info.thumbnail ?? info.thumbnails?.at(-1)?.url ?? "",
        ...(typeof info.duration === "number"
          ? { durationFormatted: formatDuration(info.duration) }
          : {}),
        ...(info.uploader || info.channel || info.creator
          ? { authorName: info.uploader || info.channel || info.creator }
          : {}),
        formats,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    const code =
      error instanceof MediaProviderError
        ? error.code
        : "extraction_failed";
    return NextResponse.json(getMediaErrorDetails(code), {
      status: code === "extractor_unavailable" ? 503 : code === "temporary_failure" ? 429 : 422,
    });
  }
}

function getDirectMediaFormat(url: URL): MediaFormat | undefined {
  const extension = url.pathname.split(".").at(-1)?.toLowerCase();
  const formats: Record<string, Pick<MediaFormat, "extension" | "formatType" | "qualityLabel">> = {
    mp4: { extension: "mp4", formatType: "video-with-audio", qualityLabel: "Direct video file" },
    webm: { extension: "webm", formatType: "video-with-audio", qualityLabel: "Direct video file" },
    mp3: { extension: "mp3", formatType: "audio-only", qualityLabel: "Direct audio file" },
    m4a: { extension: "m4a", formatType: "audio-only", qualityLabel: "Direct audio file" },
    jpg: { extension: "jpg", formatType: "image", qualityLabel: "Direct image file" },
    jpeg: { extension: "jpg", formatType: "image", qualityLabel: "Direct image file" },
    png: { extension: "png", formatType: "image", qualityLabel: "Direct image file" },
  };
  const format = extension ? formats[extension] : undefined;
  if (!format) return undefined;

  return {
    id: `direct-${format.extension}`,
    ...format,
    downloadUrl: url.toString(),
    needsRemuxing: false,
  };
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

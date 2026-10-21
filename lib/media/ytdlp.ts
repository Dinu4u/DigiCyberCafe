import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type {
  MediaExtractionErrorCode,
  MediaFormat,
  MediaSourcePlatform,
} from "@/types/mediaDownloader";

const PROCESS_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const YT_DLP_EXECUTABLE = resolve(
  process.cwd(),
  "node_modules",
  ".cache",
  "yt-dlp",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

export function getYtDlpExecutablePath(): string {
  return YT_DLP_EXECUTABLE;
}

export class MediaProviderError extends Error {
  constructor(
    public readonly code: MediaExtractionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MediaProviderError";
  }
}

export interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  height?: number;
  width?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  abr?: number;
  url?: string;
}

export interface YtDlpInfo {
  title?: string;
  thumbnail?: string;
  thumbnails?: { url?: string }[];
  duration?: number;
  uploader?: string;
  channel?: string;
  creator?: string;
  formats?: YtDlpFormat[];
  entries?: (YtDlpInfo | null)[];
}

export interface YtDlpImageFormat {
  entryIndex: number;
  formatId: string;
  extension: "jpg" | "png";
  fileSize?: number;
}

const ERROR_MESSAGES: Record<
  MediaExtractionErrorCode,
  { error: string; nextStep: string }
> = {
  private_or_restricted: {
    error: "This media is private, age-restricted, or requires an account.",
    nextStep:
      "Use media that is public and accessible without signing in. This downloader does not sign in or bypass access restrictions.",
  },
  invalid_url: {
    error: "Unrecognized or unsupported media link.",
    nextStep:
      "Paste a supported public platform link or a direct MP4, WebM, MP3, M4A, JPG, or PNG file URL.",
  },
  unavailable: {
    error: "Media no longer available or restricted by region.",
    nextStep:
      "Check if the video still plays in your browser. If it was taken down or blocked in your country, it cannot be retrieved.",
  },
  temporary_failure: {
    error: "Temporary server congestion while contacting the media provider.",
    nextStep:
      "Wait 15-30 seconds and click 'Fetch Media' again, or try a lower resolution format.",
  },
  extractor_unavailable: {
    error: "The media fetch service could not start.",
    nextStep:
      "Please try again shortly. If the problem continues, contact support and include the media link.",
  },
  extraction_failed: {
    error: "The media details could not be read from this link.",
    nextStep:
      "Check that the public link opens in your browser, then try again in a moment.",
  },
};

export function getMediaErrorDetails(code: MediaExtractionErrorCode) {
  return { code, ...ERROR_MESSAGES[code] };
}

export function classifyProviderError(
  message: string,
): MediaExtractionErrorCode {
  const normalized = message.toLowerCase();

  if (
    /private video|video is private|private account|login required|sign in to (?:view|watch) this video|age[- .]restricted|members[- .]only|subscriber[- .]only|requires authentication to (?:view|watch)/.test(
      normalized,
    )
  ) {
    return "private_or_restricted";
  }
  if (
    /http error 404|http error 410|video unavailable|media unavailable|copyright|geo.restricted|not available in your country|no longer available/.test(
      normalized,
    )
  ) {
    return "unavailable";
  }
  if (
    /429|403|5\d\d|too many requests|rate.limit|captcha|challenge|not a bot|temporarily unavailable|timed out|timeout|connection reset|connection refused|network is unreachable/.test(
      normalized,
    )
  ) {
    return "temporary_failure";
  }

  return "extraction_failed";
}

export function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(getYtDlpExecutablePath(), args, {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch {
      reject(
        new MediaProviderError(
          "extractor_unavailable",
          "Could not start yt-dlp.",
        ),
      );
      return;
    }
    if (!child.stdout || !child.stderr) {
      child.kill();
      reject(
        new MediaProviderError(
          "extractor_unavailable",
          "yt-dlp streams could not be opened.",
        ),
      );
      return;
    }
    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;

    const stdout: Buffer[] = [];
    let stdoutSize = 0;
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill();
      finish(
        new MediaProviderError(
          "temporary_failure",
          "The media provider timed out.",
        ),
      );
    }, PROCESS_TIMEOUT_MS);

    const finish = (error?: Error, output?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(output ?? "");
    };

    stdoutStream.on("data", (chunk: Buffer) => {
      stdoutSize += chunk.length;
      if (stdoutSize > MAX_OUTPUT_BYTES) {
        child.kill();
        finish(
          new MediaProviderError(
            "extraction_failed",
            "The provider returned too much metadata.",
          ),
        );
        return;
      }
      stdout.push(chunk);
    });
    stderrStream.on("data", (chunk: Buffer) => {
      if (stderr.length < 16_000) stderr += chunk.toString();
    });
    child.once("error", (error) => {
      finish(
        new MediaProviderError(
          "extractor_unavailable",
          error.message || "Could not start yt-dlp.",
        ),
      );
    });
    child.once("close", (code) => {
      if (settled) return;
      if (code === 0) {
        finish(undefined, Buffer.concat(stdout).toString("utf8"));
      } else {
        finish(new MediaProviderError(classifyProviderError(stderr), stderr));
      }
    });
  });
}

export function getPlatformLabel(platform: MediaSourcePlatform): string {
  const labels: Record<MediaSourcePlatform, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    twitter: "X / Twitter",
    facebook: "Facebook",
    tiktok: "TikTok",
    soundcloud: "SoundCloud",
    other: "Media",
  };
  return labels[platform];
}

function approximateSizeMB(bytes?: number): number | undefined {
  return bytes && bytes > 0 ? Math.round((bytes / 1024 / 1024) * 10) / 10 : undefined;
}

function makeFormat(
  url: string,
  id: string,
  extension: MediaFormat["extension"],
  formatType: MediaFormat["formatType"],
  qualityLabel: string,
  needsRemuxing: boolean,
  fileSizeApproxMB?: number,
): MediaFormat {
  const params = new URLSearchParams({ url, format: id });
  return {
    id,
    formatType,
    extension,
    qualityLabel,
    needsRemuxing,
    ...(fileSizeApproxMB ? { fileSizeApproxMB } : {}),
    downloadUrl: `/api/media/stream?${params.toString()}`,
  };
}

export function buildMediaFormats(
  info: YtDlpInfo,
  url: string,
): MediaFormat[] {
  const primaryInfo = info.entries?.find((entry) => entry?.formats?.length) ?? info;
  const formats = primaryInfo.formats ?? [];
  const videoFormats = formats.filter(
    (format) =>
      format.vcodec &&
      format.vcodec !== "none" &&
      format.acodec &&
      format.acodec !== "none" &&
      Number.isFinite(format.height) &&
      (format.ext === "mp4" || format.ext === "webm"),
  );
  const output: MediaFormat[] = [];
  const qualityTiers = [
    { height: 1080, label: "1080p (Full HD)" },
    { height: 720, label: "720p (HD)" },
    { height: 480, label: "480p" },
    { height: 360, label: "360p" },
  ];

  for (const tier of qualityTiers) {
    for (const extension of ["mp4", "webm"] as const) {
      const exactFormats = videoFormats.filter(
        (format) => format.height === tier.height && format.ext === extension,
      );
      if (exactFormats.length === 0) continue;

      const size = exactFormats
        .map((format) => format.filesize ?? format.filesize_approx)
        .find((value): value is number => typeof value === "number");
      output.push(
        makeFormat(
          url,
          `video-${tier.height}-${extension}`,
          extension,
          "video-with-audio",
          tier.label,
          false,
          approximateSizeMB(size),
        ),
      );
    }
  }

  const audioFormats = formats.filter(
    (format) =>
      format.acodec &&
      format.acodec !== "none" &&
      (!format.vcodec || format.vcodec === "none"),
  );
  if (audioFormats.length > 0) {
    const audioSize = audioFormats
      .map((format) => format.filesize ?? format.filesize_approx)
      .find((value): value is number => typeof value === "number");
    if (audioFormats.some((format) => format.ext === "m4a")) {
      output.push(
        makeFormat(
          url,
          "audio-m4a",
          "m4a",
          "audio-only",
          "M4A (Original audio)",
          false,
          approximateSizeMB(audioSize),
        ),
      );
    }
    if (audioFormats.some((format) => format.ext === "webm")) {
      output.push(
        makeFormat(
          url,
          "audio-webm",
          "webm",
          "audio-only",
          "WebM (Original audio)",
          false,
          approximateSizeMB(audioSize),
        ),
      );
    }
  }

  const imageFormats = getYtDlpImageFormats(info);
  for (const [index, image] of imageFormats.entries()) {
    const params = new URLSearchParams({
      url,
      format: `image-${index}`,
    });
    output.push({
      id: `image-${index}`,
      formatType: "image",
      extension: image.extension,
      qualityLabel:
        imageFormats.length > 1
          ? `Image ${index + 1} (High resolution)`
          : "High-resolution image",
      ...(approximateSizeMB(image.fileSize)
        ? { fileSizeApproxMB: approximateSizeMB(image.fileSize) }
        : {}),
      downloadUrl: `/api/media/stream?${params.toString()}`,
      needsRemuxing: false,
    });
  }

  return output;
}

export function getYtDlpImageFormats(info: YtDlpInfo): YtDlpImageFormat[] {
  const entries = info.entries?.length ? info.entries : [info];
  const images: YtDlpImageFormat[] = [];

  entries.forEach((entry, index) => {
    for (const format of entry?.formats ?? []) {
      if (
        (format.ext === "jpg" || format.ext === "png") &&
        format.format_id &&
        /^[A-Za-z0-9._-]+$/.test(format.format_id) &&
        format.url
      ) {
        images.push({
          entryIndex: index + 1,
          formatId: format.format_id,
          extension: format.ext,
          fileSize: format.filesize ?? format.filesize_approx,
        });
      }
    }
  });

  return images;
}

export function buildYtDlpFormatSelector(
  format: string,
): { selector: string; extension: string; postprocess: string[] } | undefined {
  const match = /^video-(1080|720|480|360)-(mp4|webm)$/.exec(format);
  if (match) {
    const height = match[1];
    const extension = match[2];
    return {
      selector: `best[height=${height}][ext=${extension}][vcodec!=none][acodec!=none]/best[height<=${height}][ext=${extension}][vcodec!=none][acodec!=none]`,
      extension,
      postprocess: [],
    };
  }
  if (format === "audio-m4a") {
    return {
      selector: "bestaudio[ext=m4a]",
      extension: "m4a",
      postprocess: [],
    };
  }
  if (format === "audio-webm") {
    return {
      selector: "bestaudio[ext=webm]",
      extension: "webm",
      postprocess: [],
    };
  }
  if (/^image-\d{1,2}$/.test(format)) {
    return { selector: "", extension: "jpg", postprocess: [] };
  }
  return undefined;
}

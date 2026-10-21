export type VideoCompressorPhase = "loading" | "preparing" | "compressing";

export type VideoCompressorProgress = {
  phase: VideoCompressorPhase;
  progress: number;
  message: string;
};

export type VideoCompressionMetrics = {
  originalBytes: number;
  compressedBytes: number;
  differencePercent: number;
  reducedBytes: number;
};

export type VideoCompressorWorkerRequest =
  | { type: "compress"; file: File }
  | { type: "cancel" };

export type VideoCompressorWorkerResponse =
  | { type: "progress"; progress: VideoCompressorProgress }
  | { type: "success"; output: ArrayBuffer }
  | { type: "cancelled" }
  | { type: "failure"; message: string };

export const MAX_VIDEO_FILE_BYTES = 120 * 1024 * 1024;

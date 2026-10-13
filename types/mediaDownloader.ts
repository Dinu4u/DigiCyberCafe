export type MediaType = "video" | "audio" | "image" | "carousel";

export type MediaSourcePlatform =
  | "youtube"
  | "instagram"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "soundcloud"
  | "other";

export interface MediaFormat {
  id: string;
  formatType: "video-with-audio" | "video-only" | "audio-only" | "image";
  extension: "mp4" | "mp3" | "webm" | "m4a" | "jpg" | "png";
  qualityLabel: string;
  fileSizeApproxMB?: number;
  downloadUrl: string;
  needsRemuxing: boolean;
}

export interface MediaExtractionRequest {
  url: string;
}

export interface MediaExtractionResponse {
  title: string;
  mediaType: MediaType;
  sourcePlatform: MediaSourcePlatform;
  thumbnailUrl: string;
  durationFormatted?: string;
  authorName?: string;
  formats: MediaFormat[];
}

export type MediaExtractionErrorCode =
  | "private_or_restricted"
  | "invalid_url"
  | "unavailable"
  | "temporary_failure"
  | "extractor_unavailable"
  | "extraction_failed";

export interface MediaExtractionError {
  code: MediaExtractionErrorCode;
  error: string;
  nextStep: string;
}

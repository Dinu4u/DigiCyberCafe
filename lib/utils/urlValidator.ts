import type { MediaSourcePlatform } from "@/types/mediaDownloader";

const platformHosts: Record<Exclude<MediaSourcePlatform, "other">, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  instagram: ["instagram.com", "www.instagram.com"],
  twitter: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  facebook: [
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "fb.watch",
    "www.fb.watch",
  ],
  tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  soundcloud: [
    "soundcloud.com",
    "www.soundcloud.com",
    "on.soundcloud.com",
  ],
};

export type MediaUrlValidation =
  | { valid: true; url: URL; platform: Exclude<MediaSourcePlatform, "other"> }
  | { valid: false };

export function validateMediaUrl(value: string): MediaUrlValidation {
  if (value.length > 2048) return { valid: false };

  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return { valid: false };
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    return { valid: false };
  }

  const hostname = url.hostname.toLowerCase();

  for (const [platform, hosts] of Object.entries(platformHosts) as [
    Exclude<MediaSourcePlatform, "other">,
    string[],
  ][]) {
    if (hosts.includes(hostname)) {
      return { valid: true, url, platform };
    }
  }

  return { valid: false };
}

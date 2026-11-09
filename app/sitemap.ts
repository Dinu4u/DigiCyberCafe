import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { publicToolDirectory } from "@/lib/seo/publicToolDirectory";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/tools` },
    { url: `${SITE_URL}/guides` },
    { url: `${SITE_URL}/guides/reduce-file-size-for-online-forms` },
    { url: `${SITE_URL}/guides/prepare-passport-photo-for-an-online-application` },
    ...["/about-us", "/contact-us", "/privacy-policy", "/terms-of-service"].map((path) => ({
      url: `${SITE_URL}${path}`,
    })),
    ...publicToolDirectory.map(({ path }) => ({ url: `${SITE_URL}${path}` })),
  ];
}

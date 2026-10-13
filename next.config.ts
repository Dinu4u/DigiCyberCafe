import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/media/*": ["./node_modules/.cache/yt-dlp/**/*"],
  },
};

export default nextConfig;

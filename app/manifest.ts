import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "eCyberCafe | Digital Cyber Café & Document Hub",
    short_name: "eCyberCafe",
    description:
      "Private browser-based document, PDF, photo, and exam tools for everyday work.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#254b38",
    categories: ["utilities", "productivity"],
    lang: "en-IN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

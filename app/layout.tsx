import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import "./pdf-tools.css";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { AD_CONFIG } from "@/config/adPolicy";
import { AnalyticsConsent } from "@/components/analytics/AnalyticsConsent";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DigiCyberCafe | In-Browser Document, PDF & Photo Tools",
    template: "%s | DigiCyberCafe",
  },
  description:
    "Free digital cyber café for exam forms, office files, and daily documents. Resize photos for upload limits, add exam photo details, edit and sign PDFs, and use browser-based tools with local processing where supported.",
  keywords: [
    "DigiCyberCafe",
    "online cyber cafe",
    "sarkari photo resizer 50kb",
    "ssc photo name date maker",
    "pdf compress under 200kb",
    "passport photo resize online",
    "client side pdf tools",
    "target kb photo resizer",
    "browser based document utility",
    "privacy friendly file tools",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "DigiCyberCafe",
    url: SITE_URL,
    title: "DigiCyberCafe | In-Browser Document, PDF & Photo Tools",
    description:
      "Free document, PDF, photo, and exam tools with local processing where supported.",
    locale: "en_IN",
    alternateLocale: ["hi_IN", "en_US"],
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DigiCyberCafe passport photo resizer, target file-size tools, and PDF utilities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiCyberCafe | In-Browser Document, PDF & Photo Tools",
    description:
      "Free document, PDF, photo, and exam tools with local processing where supported.",
    images: ["/opengraph-image"],
  },
  applicationName: "DigiCyberCafe",
  creator: "Dinesh Kumar",
  publisher: "Dinesh Kumar",
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  other: {
    "contact:email": AD_CONFIG.PUBLISHER_INFO.EMAIL,
    "geo.region": "IN",
    "geo.placename": "Patna, Bihar, India",
  },
  category: "utilities",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#254b38",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body>
        <Header />
        <JsonLd />
        {children}
        <Footer />
        <AnalyticsConsent />
        <SpeedInsights />
      </body>
    </html>
  );
}

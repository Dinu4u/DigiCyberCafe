import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PhotoEnhancer } from "@/components/tools/PhotoEnhancer";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/photo-enhancer-online" },
  title: "AI Photo Enhancer Online Free - Unblur & Sharpen Images",
  description: "1-Click Image Quality Improver (Private & Offline). Enhance, sharpen, and upscale photos in your browser without uploading them.",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Photo Enhancer & Upscaler",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      description: "Enhance, sharpen, denoise, and upscale photos privately with browser-based image processing.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: ["Client-side image processing", "Auto contrast and vibrance", "Brightness, exposure, color, and sharpening controls", "2x high-quality interpolation", "JPG, PNG, and WebP export"],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Are my photos uploaded to a server?", acceptedAnswer: { "@type": "Answer", text: "No. Your selected photo is decoded in your browser and pixel processing runs in a local Web Worker. The source image is not sent to a server." } },
        { "@type": "Question", name: "What does the 2x upscale do?", acceptedAnswer: { "@type": "Answer", text: "It resamples the enhanced image to twice its original width and height using high-quality browser interpolation. It can make output dimensions larger, but it cannot recover detail that was not present in the original." } },
        { "@type": "Question", name: "What happens with very large images?", acceptedAnswer: { "@type": "Answer", text: "Images above the browser pixel safety limit show a recovery option to downscale and enhance locally. This reduces memory use before pixel processing." } },
        { "@type": "Question", name: "Which formats can I export?", acceptedAnswer: { "@type": "Answer", text: "The tool exports JPEG, PNG, or WebP. JPEG and WebP include a quality setting; PNG preserves lossless encoding." } },
      ],
    },
  ],
};

const faqs = [
  {
    question: "Are my photos uploaded to a server?",
    answer: "No. Your selected photo is decoded in your browser and pixel processing runs in a local Web Worker. The original image is not sent to a server.",
  },
  {
    question: "What does the 2x upscale do?",
    answer: "It resamples the enhanced image to twice its original width and height using high-quality browser interpolation. It increases output dimensions, but cannot recover detail that was not present in the original.",
  },
  {
    question: "What happens with very large images?",
    answer: "Images above the browser pixel safety limit show a recovery option to downscale and enhance locally. This reduces memory use before pixel processing.",
  },
  {
    question: "Which formats can I export?",
    answer: "Export JPEG, PNG, or WebP. JPEG and WebP include a quality setting; PNG uses lossless encoding.",
  },
  {
    question: "Can sharpening or contrast make a photo look worse?",
    answer: "Yes. Strong sharpening and contrast can amplify grain or clip highlights. If an extreme result is detected, use Reset to Recommended and adjust the sliders more gently.",
  },
  {
    question: "How do I compare the original and enhanced versions?",
    answer: "Drag the comparison slider across the preview. Choose 100% or 200% to inspect pixels more closely; at 200%, drag the image to pan around the preview.",
  },
];

export default function PhotoEnhancerOnlinePage() {
  return <div className="tool-shell">
    <header className="builder-topbar">
      <Link className="back-link" href="/"><ArrowLeft size={17} /> Photo Enhancer</Link>
    </header>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <PhotoEnhancer />
    <section className="mx-auto max-w-5xl space-y-5 px-5 pb-14 pt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Photo enhancer questions</h2>
      {faqs.map((faq) => <div key={faq.question}><h3 className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</h3><p>{faq.answer}</p></div>)}
    </section>
  </div>;
}
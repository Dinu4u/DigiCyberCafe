import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import { AeoContentBlock } from "@/components/seo/AeoContentBlock";
import { ServerJsonLd } from "@/components/seo/ServerJsonLd";
import { VideoCompressor } from "@/components/tools/video/VideoCompressor";
import { generateToolSchema } from "@/lib/seo/schemaGenerators";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const description =
  "Compress a video to a standard 720p maximum in your browser. Check the actual output file size and percentage change, then download an MP4 without uploading your video.";

const steps: ToolHowToStep[] = [
  { name: "Choose a video", text: "Select or drop a supported video file up to 120 MB. The video is processed on your device." },
  { name: "Compress the video", text: "Start compression to encode a standard MP4 with a maximum video height of 720 pixels. Smaller source videos are not upscaled." },
  { name: "Check the result", text: "Review the actual compressed file size and percentage saved or increased compared with the original." },
  { name: "Download the MP4", text: "Download the compressed video if its size and quality meet your needs; compression can increase the size of some source videos." },
];

const faqs: ToolFaq[] = [
  { question: "Is my video uploaded to a server?", answer: "No. FFmpeg.wasm processes the selected video locally in a browser worker. The FFmpeg runtime files are downloaded from a CDN, but your video file is not sent to that CDN or to DigiCyberCafe." },
  { question: "What resolution does the compressor use?", answer: "The tool encodes videos with a maximum height of 720 pixels and preserves the aspect ratio. Smaller source videos are not upscaled." },
  { question: "Will every compressed video be smaller?", answer: "No. The result depends on the original codec, bitrate, dimensions, and audio. The tool reports the measured size change and can produce a larger file for some sources." },
  { question: "What happens to subtitles and audio?", answer: "The output is an MP4 with the first video stream and available audio streams. Embedded subtitles and other non-video streams are not included." },
  { question: "Why is there a 120 MB file limit?", answer: "Video encoding uses substantial browser memory and processor time. The input-size limit, single-threaded encoding, and isolated worker help keep local processing more predictable, but available memory still varies by device." },
];

export const metadata: Metadata = {
  alternates: { canonical: "/tools/video-compressor-reduce-size" },
  title: "Smart Video Compressor",
  description,
};

export default function VideoCompressorPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar">
        <Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link>
      </header>
      <ServerJsonLd
        data={generateToolSchema({
          name: "Smart Video Compressor",
          path: "/tools/video-compressor-reduce-size",
          description,
          faqs,
          howTo: { name: "Compress a video in your browser", steps },
        })}
      />
      <AdBannerSlot slotId="photo-tool-leaderboard" format="leaderboard" className="mx-auto my-5 max-w-5xl px-4" />
      <VideoCompressor />
      <AeoContentBlock
        title="Compress and resize a video locally"
        introduction="This free video compressor uses FFmpeg.wasm in a browser worker to encode a standard MP4 with a maximum height of 720 pixels. It reports the actual output size and percentage change instead of promising a fixed reduction; results vary with each source video."
        steps={steps}
        specifications={[
          { label: "Input", value: "One supported video file up to 120 MB" },
          { label: "Video dimensions", value: "Maximum output height of 720 pixels; aspect ratio is preserved and smaller videos are not upscaled" },
          { label: "Output", value: "MP4 using H.264 video and AAC audio, with actual output size and measured percentage change" },
          { label: "Streams", value: "First video stream and available audio streams; embedded subtitles and other non-video streams are omitted" },
          { label: "Runtime", value: "FFmpeg.wasm runtime files are fetched from a CDN; selected video content remains on the device" },
        ]}
        privacy="Compression runs locally in a dedicated browser worker. The FFmpeg JavaScript and WebAssembly runtime are fetched from unpkg.com, but the selected video is neither uploaded to DigiCyberCafe nor sent to the CDN. Processing speed and available memory depend on the browser and device."
        faqs={faqs}
      />
    </main>
  );
}

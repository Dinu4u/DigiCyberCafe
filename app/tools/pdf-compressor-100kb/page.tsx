import { permanentRedirect } from "next/navigation";

export default function PdfCompressorAliasPage() {
  permanentRedirect("/tools/compress-pdf-to-target-kb");
}

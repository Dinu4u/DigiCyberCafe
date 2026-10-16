import { ServerJsonLd } from "@/components/seo/ServerJsonLd";
import { generateSiteSchema } from "@/lib/seo/schemaGenerators";

export function JsonLd() {
  return <ServerJsonLd data={generateSiteSchema()} />;
}

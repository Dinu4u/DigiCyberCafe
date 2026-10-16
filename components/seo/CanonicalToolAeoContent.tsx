import { AeoContentBlock } from "@/components/seo/AeoContentBlock";
import { ServerJsonLd } from "@/components/seo/ServerJsonLd";
import { generateToolSchema } from "@/lib/seo/schemaGenerators";
import { toolAeoContent } from "@/lib/seo/toolAeoContent";

export function CanonicalToolAeoContent({ slug }: { slug: keyof typeof toolAeoContent }) {
  const content = toolAeoContent[slug];

  return (
    <>
      <ServerJsonLd
        data={generateToolSchema({
          name: content.name,
          path: content.path,
          description: content.description,
          faqs: content.faqs,
          howTo: { name: content.title, steps: content.steps },
        })}
      />
      <AeoContentBlock
        title={content.title}
        introduction={content.description}
        steps={content.steps}
        specifications={content.specifications}
        privacy={content.privacy}
        faqs={content.faqs}
      />
    </>
  );
}

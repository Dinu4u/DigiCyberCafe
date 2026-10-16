import type { ToolFaq, ToolHowToStep } from "@/types/advertising";
import { ServerJsonLd } from "@/components/seo/ServerJsonLd";
import { generateToolSchema } from "@/lib/seo/schemaGenerators";

type Props = {
  name: string;
  path: string;
  description: string;
  faqs: ToolFaq[];
  howTo: {
    name: string;
    steps: ToolHowToStep[];
  };
};

export default function JsonLdSchema({ name, path, description, faqs, howTo }: Props) {
  return (
    <ServerJsonLd
      data={generateToolSchema({ name, path, description, faqs, howTo })}
    />
  );
}

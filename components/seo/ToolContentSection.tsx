import { AeoContentBlock } from "@/components/seo/AeoContentBlock";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

type Props = {
  title: string;
  introduction: string;
  steps: ToolHowToStep[];
  specifications: { label: string; value: string }[];
  privacy: string;
  faqs: ToolFaq[];
};

export default function ToolContentSection(props: Props) {
  return <AeoContentBlock {...props} />;
}

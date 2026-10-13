import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

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

const siteUrl = "https://ecybercafe.in";

export default function JsonLdSchema({ name, path, description, faqs, howTo }: Props) {
  const url = `${siteUrl}${path}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#application`,
        name,
        url,
        description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        publisher: { "@id": `${siteUrl}/#organization` },
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      ...(faqs.length > 0
        ? [{
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            mainEntity: faqs.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          }]
        : []),
      ...(howTo.steps.length > 0
        ? [{
            "@type": "HowTo",
            "@id": `${url}#how-to`,
            name: howTo.name,
            description,
            step: howTo.steps.map((step, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: step.name,
              text: step.text,
            })),
          }]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}

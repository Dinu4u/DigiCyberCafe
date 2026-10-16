import type { ToolFaq, ToolHowToStep } from "@/types/advertising";
import { SITE_URL } from "@/lib/seo/site";

type ToolSchemaOptions = {
  name: string;
  path: string;
  description: string;
  faqs?: ToolFaq[];
  howTo?: {
    name: string;
    steps: ToolHowToStep[];
  };
};

export function generateSiteSchema(): Record<string, unknown> {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "DigiCyberCafe",
        url: SITE_URL,
        founder: {
          "@type": "Person",
          name: "Dinesh Kumar",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Patna",
          addressRegion: "Bihar",
          postalCode: "800024",
          addressCountry: "IN",
        },
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.svg`,
        },
        description:
          "Online document, photo, PDF, and everyday utility tools operated from Patna, India. File processing varies by tool.",
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: "DigiCyberCafe",
        inLanguage: ["en-IN", "hi-IN"],
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${SITE_URL}/#application`,
        name: "DigiCyberCafe",
        url: SITE_URL,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        browserRequirements:
          "Requires a modern web browser with JavaScript. Processing and data handling depend on the selected tool.",
        description:
          "Document, PDF, photo, calculator, and business utility tools. See each tool page for supported features and processing details.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function generateToolSchema({
  name,
  path,
  description,
  faqs = [],
  howTo,
}: ToolSchemaOptions): Record<string, unknown> {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const url = new URL(path, SITE_URL).toString();
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebApplication",
      "@id": `${url}#application`,
      name,
      url,
      description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web Browser",
      browserRequirements:
        "Requires a modern web browser with JavaScript. See this page for tool-specific input, output, and processing details.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      publisher: { "@id": organizationId },
      isPartOf: { "@id": websiteId },
    },
  ];

  if (howTo && howTo.steps.length > 0) {
    graph.push({
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
    });
  }

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

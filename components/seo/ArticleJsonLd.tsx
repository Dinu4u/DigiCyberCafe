import { ServerJsonLd } from "@/components/seo/ServerJsonLd";
import { SITE_URL } from "@/lib/seo/site";

type ArticleJsonLdProps = {
  path: string;
  headline: string;
  description: string;
};

export function ArticleJsonLd({
  path,
  headline,
  description,
}: ArticleJsonLdProps) {
  const url = new URL(path, SITE_URL).toString();

  return (
    <ServerJsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        mainEntityOfPage: url,
        author: {
          "@type": "Person",
          name: "Dinesh Kumar",
        },
        publisher: {
          "@type": "Organization",
          name: "DigiCyberCafe",
          url: SITE_URL,
        },
      }}
    />
  );
}

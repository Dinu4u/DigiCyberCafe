const siteUrl = "https://ecybercafe.in";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "DigiCyberCafe",
      alternateName: ["Digital Cyber Cafe", "CyberCafe Online"],
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.svg`,
      },
      description:
        "Free online document, photo, PDF, exam-photo, and media utilities, including browser-based tools for local file processing.",
      areaServed: [
        { "@type": "Country", name: "India" },
        { "@type": "Place", name: "Worldwide" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "DigiCyberCafe",
      alternateName: ["Digital Cyber Cafe", "CyberCafe Online"],
      inLanguage: ["en-IN", "en-US", "hi-IN"],
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": ["WebApplication", "SoftwareApplication"],
      "@id": `${siteUrl}/#application`,
      name: "DigiCyberCafe",
      url: siteUrl,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web Browser (Windows, Mac, Android, iOS)",
      description:
        "Free document and photo tools, including browser-based local processing for supported file operations.",
      areaServed: [
        { "@type": "Country", name: "India" },
        { "@type": "Place", name: "Worldwide" },
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      featureList: [
        "Target-size image and PDF compression",
        "Exam Photo with Name and Date (DOP) Maker",
        "Passport-size photo creation and resizing",
        "PDF conversion, merging, splitting, signing, and watermarking",
        "Browser-based local processing for supported tools",
      ],
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}

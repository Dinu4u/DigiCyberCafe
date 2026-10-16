type ServerJsonLdProps = {
  data: Record<string, unknown>;
};

export function ServerJsonLd({ data }: ServerJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

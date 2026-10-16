import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

type AeoContentBlockProps = {
  title: string;
  introduction: string;
  steps: ToolHowToStep[];
  specifications: { label: string; value: string }[];
  privacy: string;
  faqs: ToolFaq[];
};

export function AeoContentBlock({
  title,
  introduction,
  steps,
  specifications,
  privacy,
  faqs,
}: AeoContentBlockProps) {
  return (
    <section
      className="mx-auto mt-10 max-w-5xl rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 sm:p-8"
      aria-labelledby="tool-content-title"
    >
      <h2 id="tool-content-title" className="font-serif text-2xl font-normal text-slate-900">
        {title}
      </h2>
      <p className="mt-3">{introduction}</p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="tool-howto-title">
          <h3 id="tool-howto-title" className="font-semibold text-slate-900">
            How it works
          </h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            {steps.map((step, index) => (
              <li key={`${step.name}-${index}`} className="pl-1">
                <strong>{step.name}</strong>
                <p className="mt-1">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="tool-spec-title">
          <h3 id="tool-spec-title" className="font-semibold text-slate-900">
            Specifications and notes
          </h3>
          <table className="mt-3 w-full border-collapse rounded-lg border border-slate-200 text-left">
            <tbody>
              {specifications.map(({ label, value }) => (
                <tr key={label} className="border-b border-slate-200 last:border-0">
                  <th scope="row" className="w-1/3 p-3 align-top font-medium text-slate-800">
                    {label}
                  </th>
                  <td className="p-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <section className="mt-7 rounded-lg bg-emerald-50 p-4" aria-labelledby="tool-privacy-title">
        <h3 id="tool-privacy-title" className="font-semibold text-slate-900">
          Privacy and processing
        </h3>
        <p className="mt-1">{privacy}</p>
      </section>
      {faqs.length > 0 && (
        <section className="mt-7" aria-labelledby="tool-faq-title">
          <h3 id="tool-faq-title" className="font-semibold text-slate-900">
            Frequently asked questions
          </h3>
          {faqs.map(({ question, answer }) => (
            <details key={question} className="border-b border-slate-200 py-3">
              <summary className="cursor-pointer font-medium text-slate-800">{question}</summary>
              <p className="mt-2">{answer}</p>
            </details>
          ))}
        </section>
      )}
    </section>
  );
}

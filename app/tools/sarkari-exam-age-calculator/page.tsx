import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExamAgeCalculator } from "@/components/tools/age-calculator/ExamAgeCalculator";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const title =
  "Sarkari Exam Age Calculator";
const description =
  "Calculate exact exam age from Gregorian or Hindu lunar birth dates. Convert Vikram Samvat, Purnimanta month, paksha and tithi to a Gregorian date using birth city and optional birth time.";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/sarkari-exam-age-calculator" },
  title: { absolute: title },
  description,
};

const steps: ToolHowToStep[] = [
  { name: "Enter birth date", text: "Enter a Gregorian birth date or choose a Hindu lunar date with Vikram Samvat year, Purnimanta month, paksha, tithi, and birth city." },
  { name: "Set the cutoff", text: "Choose the recruitment notification cutoff date; eligibility is evaluated as of this date." },
  { name: "Review the estimate", text: "Check your exact age and compare the catalog's indicative central or state age ranges with your selected options." },
];

const faqs: ToolFaq[] = [
  { question: "How is age calculated on a government exam cutoff date?", answer: "The calculator compares the Gregorian birth date with the cutoff date and returns years, months, and days. Always follow the date and rules in the official recruitment notice." },
  { question: "Does category relaxation guarantee eligibility?", answer: "No. The calculator applies simplified indicative relaxations. Official exam notices may include post, service, domicile, and other conditions." },
  { question: "How does Hindu lunar date conversion work?", answer: "Choose the Vikram Samvat year, Purnimanta masa, paksha, and tithi. The calculator uses the selected birth city for its time zone and local sunrise, then resolves matching Gregorian dates in your browser. An optional birth time checks the tithi at that time; without it, tithi is checked at local sunrise." },
  { question: "What does the Adhika month option mean?", answer: "Select it only when your recorded Panchang date names an Adhika (intercalary) masa. The calculated result is an astronomical estimate; regional Panchang conventions can differ, so verify dates against family records or a trusted local Panchang." },
  { question: "Is my date of birth uploaded?", answer: "No. DOB, time, and selected lunar date stay in the browser. Only the city-name lookup is sent through DigiCyberCafe to Open-Meteo's geocoding service; coordinates returned for the selected city are used locally." },
];

export default function SarkariExamAgeCalculatorPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar">
        <Link className="back-link" href="/#tools">
          <ArrowLeft size={17} /> All tools
        </Link>
      </header>
      <div style={{ maxWidth: 1115, margin: "0 auto", padding: "30px 5.2%" }}>
        <JsonLdSchema
          name="Sarkari Exam Age Calculator"
          path="/tools/sarkari-exam-age-calculator"
          description={description}
          faqs={faqs}
          howTo={{ name: "Calculate age against a government exam cutoff date", steps }}
        />
        <AdBannerSlot slotId="exam-age-leaderboard" format="leaderboard" className="mb-5" />
        <ExamAgeCalculator />
        <section className="exam-age-seo-guide" aria-labelledby="age-guide-heading">
          <h1 id="age-guide-heading">Government exam age limits and relaxation guide</h1>
          <p>
            Recruitment age is normally calculated against a specific date stated in each
            notification. This calculator compares your Gregorian age on that cutoff with
            baseline limits for selected UPSC, SSC, railway, banking, defence and state
            recruitment exams. The listed ranges are indicative, not a substitute for the
            current official advertisement.
          </p>
          <h2>How category age relaxation is estimated</h2>
          <ul>
            <li>General (UR) and EWS: no general age addition is applied in this estimate.</li>
            <li>OBC-NCL: a modeled addition of 3 years.</li>
            <li>SC and ST: a modeled addition of 5 years.</li>
            <li>PwBD: 10 years for General, 13 years for OBC, or 15 years for SC/ST in this estimate.</li>
          </ul>
          <p>
            Central UPSC and SSC notifications define their own category, service and post
            conditions. State Public Service Commissions and police boards may add domicile,
            gender, service, horizontal-reservation or post-specific rules. EWS does not
            automatically receive an age extension, and state relaxations are not uniform.
            Always use the exact cutoff date, qualification and category wording in the
            official notification before relying on an eligibility decision.
          </p>
          <h2>Calendar conversion note</h2>
          <p>
            Gregorian dates remain the baseline for age and eligibility comparisons. The
            optional Hindu lunar input resolves a Vikram Samvat year, Purnimanta masa,
            paksha, and tithi to a Gregorian date using astronomical moon phases, a
            sidereal month estimate, and local sunrise for the selected birth city. If birth
            time is entered, the tithi is checked at that local time; otherwise it is checked
            at local sunrise. The city name is looked up through Open-Meteo geocoding, while
            the DOB, time, and lunar selections remain in the browser. Panchang and
            intercalary-month conventions differ by region; treat this as an estimate and
            confirm it against family records or a trusted local Panchang.
          </p>
        </section>
        <ToolContentSection
          title="How government exam cutoff age is evaluated"
          introduction="Exam age is normally measured on the cutoff date specified in a recruitment notification. This tool calculates an exact Gregorian age and compares it with a catalog of indicative age ranges; it does not replace official eligibility rules."
          steps={steps}
          specifications={[
            { label: "Date basis", value: "Gregorian calendar dates, compared by calendar years, months, and days." },
            { label: "Category", value: "Optional illustrative relaxation; rules vary by exam, post, and notification." },
            { label: "Calendar", value: "Hindu lunar dates resolve locally using Purnimanta month, paksha, tithi, birth city, and optional time." },
            { label: "Authority", value: "The current official recruitment notification is authoritative." },
          ]}
          privacy="Birth date, birth time, lunar-date selection, and age computations run locally in the browser. Only the entered city name is used by the server-side Open-Meteo geocoding lookup; the DOB is not sent. Results are estimates and are not submitted to an exam authority."
          faqs={faqs}
        />
        <style>{`
          .exam-age-seo-guide{border:1px solid #e4e9e3;border-radius:8px;padding:24px;background:#fff}
          .exam-age-seo-guide h1{margin:0 0 12px;color:#35513b;font:400 26px Georgia,serif}
          .exam-age-seo-guide h2{margin:19px 0 7px;color:#4a5d4d;font:700 14px Arial,sans-serif}
          .exam-age-seo-guide p,.exam-age-seo-guide li{color:#758077;font:12px/1.7 Arial,sans-serif}
          .exam-age-seo-guide ul{padding-left:20px}
        `}</style>
      </div>
    </main>
  );
}

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
  "Calculate exact age on an exam cutoff date or work experience between two dates. See indicative government exam eligibility while keeping date calculations on your device.";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/sarkari-exam-age-calculator" },
  title: { absolute: title },
  description,
};

const steps: ToolHowToStep[] = [
  { name: "Choose a calculation", text: "Select age and exam eligibility, or work experience." },
  { name: "Enter the dates", text: "Enter a date of birth or experience start date, then choose the exam cutoff date or experience end date." },
  { name: "Review the result", text: "Check the calculated years, months, and days. Age results also show indicative central or state exam age ranges." },
];

const faqs: ToolFaq[] = [
  { question: "How is age calculated on a government exam cutoff date?", answer: "The calculator compares the Gregorian birth date with the cutoff date and returns years, months, and days. Always follow the date and rules in the official recruitment notice." },
  { question: "Will the calculator show my age if I am too young for an exam?", answer: "Yes. It calculates and displays your age, then marks the listed exams as under-age when their minimum age is not met." },
  { question: "Can I calculate work experience?", answer: "Yes. Choose Work experience, enter the experience start date and end date, and the calculator returns the duration in years, months, and days." },
  { question: "Does category relaxation guarantee eligibility?", answer: "No. The calculator applies simplified indicative relaxations. Official exam notices may include post, service, domicile, and other conditions." },
  { question: "Are my dates uploaded?", answer: "No. Age, experience, and eligibility calculations run locally in your browser." },
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
          <h2>Calculate work experience</h2>
          <p>
            Choose Work experience, enter the job start date, and set the end date (today by
            default) to calculate the elapsed years, months, and days. This is a date
            difference only and does not verify employment history.
          </p>
        </section>
        <ToolContentSection
          title="Calculate age, exam eligibility, and work experience"
          introduction="Calculate age on a recruitment cutoff date or calculate work experience between two dates. Exam age ranges are indicative only and do not replace the official recruitment notification."
          steps={steps}
          specifications={[
            { label: "Date basis", value: "Gregorian calendar dates, compared by calendar years, months, and days." },
            { label: "Category", value: "Optional illustrative relaxation; rules vary by exam, post, and notification." },
            { label: "Work experience", value: "Elapsed time between the entered start and end dates; employment is not verified." },
            { label: "Authority", value: "The current official recruitment notification is authoritative." },
          ]}
          privacy="Date, age, experience, and eligibility calculations run locally in your browser. Dates are not sent to a server, and results are not submitted to an exam authority."
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MutualFundCalculator } from "@/components/tools/calculator/MutualFundCalculator";
import styles from "@/components/tools/calculator/MutualFundCalculator.module.css";
import AdBannerSlot from "@/components/ads/AdBannerSlot";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import ToolContentSection from "@/components/seo/ToolContentSection";
import type { ToolFaq, ToolHowToStep } from "@/types/advertising";

const title = "SIP and Lumpsum Mutual Fund Calculator";
const description =
  "Calculate mutual fund returns for SIP, one-time lumpsum, and hybrid monthly SIP with periodic lumpsum top-up (quarterly, half-yearly, yearly). Free, private & instant.";

export const metadata: Metadata = {
  alternates: { canonical: "/tools/mutual-fund-sip-lumpsum-calculator" },
  title: { absolute: title },
  description,
};

const steps: ToolHowToStep[] = [
  { name: "Choose an investment mode", text: "Select monthly SIP, one-time lumpsum, or SIP with periodic lumpsum top-ups." },
  { name: "Set amount and assumptions", text: "Enter contributions, expected annual return, and investment horizon. These are assumptions, not guaranteed returns." },
  { name: "Compare the projection", text: "Review total contributions, estimated returns, maturity value, and the yearly growth table." },
];

const faqs: ToolFaq[] = [
  { question: "How does this SIP calculator estimate returns?", answer: "It simulates contributions and monthly compounding using the selected annual return rate. Actual mutual-fund returns vary and are not guaranteed." },
  { question: "Can I calculate a lumpsum investment?", answer: "Yes. Choose One-Time Lumpsum, enter the amount and horizon, and review the monthly-compounded estimate." },
  { question: "What is a hybrid SIP and lumpsum projection?", answer: "It combines monthly contributions with additional lumpsum deposits at the chosen interval, such as quarterly or yearly." },
  { question: "Are these projected values guaranteed?", answer: "No. This is an illustrative mathematical projection, not investment advice or a promise of performance." },
];

export default function MutualFundCalculatorPage() {
  return (
    <main className="tool-shell">
      <header className="builder-topbar">
        <Link className="back-link" href="/#tools">
          <ArrowLeft size={17} /> All tools
        </Link>
      </header>
      <div style={{ maxWidth: 1115, margin: "0 auto", padding: "30px 5.2%" }}>
        <JsonLdSchema
          name="Mutual Fund Calculator"
          path="/tools/mutual-fund-sip-lumpsum-calculator"
          description={description}
          faqs={faqs}
          howTo={{ name: "Estimate SIP, lumpsum, or hybrid investment growth", steps }}
        />
        <AdBannerSlot slotId="mutual-fund-leaderboard" format="leaderboard" className="mb-5" />
        <MutualFundCalculator />
        <section className={styles.guide} aria-labelledby="investment-guide-title">
          <h2 id="investment-guide-title">Understanding SIP and lumpsum projections</h2>
          <h3>SIP annuity-due investing and lumpsum compounding</h3>
          <p>
            This calculator models each monthly SIP at the start of its contribution month,
            then compounds it monthly at the equivalent monthly rate. This is an annuity-due
            illustration; investing at month-end would produce a slightly different value.
            A one-time lumpsum is added at the beginning of the first month and compounded
            for the selected horizon using the same monthly convention.
          </p>
          <h3>Periodic lumpsum top-ups alongside a SIP</h3>
          <p>
            Hybrid mode combines regular monthly contributions with an additional lumpsum
            at the start of every selected interval. A monthly, quarterly, half-yearly, or
            yearly top-up can increase the amount invested sooner, giving each contribution
            more time in the market. The projection assumes the selected annual return stays
            constant, which actual investments do not.
          </p>
          <h3>Returns depend on the fund and market</h3>
          <p>
            Equity funds can have higher long-term growth potential but also significant
            volatility and loss risk. Hybrid funds combine equity and debt exposure with
            returns dependent on their asset allocation and market conditions. Debt funds
            generally have different risk and return characteristics, and are not risk-free.
            Historical returns are not a promise of future performance. Review the scheme
            documents, costs, taxes and your risk tolerance before investing.
          </p>
        </section>
        <ToolContentSection
          title="Estimate mutual fund SIP and lumpsum growth"
          introduction="Compare monthly SIP, one-time lumpsum, and periodic top-up projections using a transparent monthly compounding illustration. Returns and projected values can differ from actual investments."
          steps={steps}
          specifications={[
            { label: "Investment modes", value: "Monthly SIP, one-time lumpsum, or periodic hybrid contributions." },
            { label: "Compounding", value: "Monthly simulation using the annual return assumption entered." },
            { label: "Time horizon", value: "Choose the investment period supported by the calculator controls." },
            { label: "Risk reminder", value: "Mutual fund investments are subject to market risks; returns are not guaranteed." },
          ]}
          privacy="Investment inputs and projections are calculated in your browser; values are not submitted to an investment service."
          faqs={faqs}
        />
      </div>
    </main>
  );
}

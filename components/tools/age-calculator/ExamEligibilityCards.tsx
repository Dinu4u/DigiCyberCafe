import { ArrowUpRight, CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { EligibilityResult } from "@/types/examEligibility";
import styles from "./ExamEligibilityCards.module.css";

type Props = {
  results: EligibilityResult[];
};

function formatRemaining(years: number, months: number): string {
  const yearText = `${years} ${years === 1 ? "year" : "years"}`;
  const monthText = `${months} ${months === 1 ? "month" : "months"}`;
  return `${yearText} ${monthText}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ExamEligibilityCards({ results }: Props) {
  if (results.length === 0) {
    return <p className={styles.empty}>No exams match this qualification filter.</p>;
  }

  return (
    <div className={styles.grid}>
      {results.map((result) => {
        const { exam, status } = result;
        const StatusIcon =
          status === "ELIGIBLE" ? CheckCircle2 : status === "OVER_AGE" ? XCircle : Clock3;
        const statusLabel =
          status === "ELIGIBLE" ? "Eligible" : status === "OVER_AGE" ? "Over-age" : "Under-age";

        return (
          <article className={`${styles.card} ${styles[status.toLowerCase()]}`} key={exam.id}>
            <div className={styles.cardHeader}>
              <span className={styles.organization}>{exam.organization}</span>
              <span className={styles.status}>
                <StatusIcon size={15} aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
            <h3>{exam.name}</h3>
            <p className={styles.ageRange}>
              {Math.floor(exam.minimumAgeMonths / 12)}
              {exam.minimumAgeMonths % 12 ? ` years ${exam.minimumAgeMonths % 12} months` : ""}
              {"–"}
              {result.maximumEligibleAge} years
              {result.relaxationYears > 0 && ` (includes +${result.relaxationYears} years relaxation)`}
            </p>
            {status === "ELIGIBLE" && (
              <p className={styles.statusText}>
                {formatRemaining(result.remainingYears ?? 0, result.remainingMonths ?? 0)} before upper age limit
              </p>
            )}
            {status === "OVER_AGE" && (
              <p className={styles.statusText}>
                Over the modeled upper-age window by{" "}
                {formatRemaining(result.overAgeYears ?? 0, result.overAgeMonths ?? 0)}{" "}
                {result.overAgeDays ?? 0} {(result.overAgeDays ?? 0) === 1 ? "day" : "days"}.
              </p>
            )}
            {status === "UNDER_AGE" && (
              <p className={styles.statusText}>
                Minimum age reached on {result.eligibleOn ? formatDate(result.eligibleOn) : "the required date"}.
              </p>
            )}
            {exam.note && <p className={styles.note}>{exam.note}</p>}
            <a href={exam.officialUrl} target="_blank" rel="noreferrer">
              Official notification site <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </article>
        );
      })}
    </div>
  );
}

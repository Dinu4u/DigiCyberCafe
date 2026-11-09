"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  evaluateEligibility,
  examStates,
} from "@/lib/constants/governmentExamsData";
import {
  calculateExactAge,
  parseLocalDate,
  toLocalDateInputValue,
} from "@/lib/utils/dateMath";
import type {
  ExactAge,
  Qualification,
  SocialCategory,
  PwbdBaseCategory,
} from "@/types/examEligibility";
import { ExamEligibilityCards } from "./ExamEligibilityCards";
import styles from "./ExamAgeCalculator.module.css";

type CalculatorError = {
  title: string;
  message: string;
  nextStep: string;
};

const categoryLabels: Record<SocialCategory, string> = {
  UR: "General (UR)",
  EWS: "EWS",
  OBC: "OBC-NCL",
  SC: "SC",
  ST: "ST",
  PwBD: "PwBD",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ageMessage(age: ExactAge): string {
  return `${age.years} ${age.years === 1 ? "Year" : "Years"}, ${String(age.months).padStart(2, "0")} ${age.months === 1 ? "Month" : "Months"}, ${String(age.days).padStart(2, "0")} ${age.days === 1 ? "Day" : "Days"}`;
}

function getRelaxation(category: SocialCategory, pwbdBaseCategory: PwbdBaseCategory): number {
  if (category === "PwBD") {
    if (pwbdBaseCategory === "OBC") return 13;
    if (pwbdBaseCategory === "SC_ST") return 15;
    return 10;
  }
  if (category === "OBC") return 3;
  if (category === "SC" || category === "ST") return 5;
  return 0;
}

function getTodayDateValue(): string {
  return toLocalDateInputValue(new Date());
}

function ErrorAlert({ error }: { error: CalculatorError }) {
  return (
    <div className={styles.alert} role="alert">
      <strong>{error.title}</strong>
      <p>{error.message}</p>
      <p>{error.nextStep}</p>
    </div>
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}

export function ExamAgeCalculator({ compact = false }: { compact?: boolean }) {
  const defaultCutoffValue = useSyncExternalStore(subscribeToNothing, getTodayDateValue, () => "");
  const [dobOverride, setDobOverride] = useState<string | null>(null);
  const [cutoffOverride, setCutoffOverride] = useState<string | null>(null);
  const [calculatorMode, setCalculatorMode] = useState<"age" | "experience">("age");
  const dobValue = dobOverride ?? "";
  const cutoffValue = cutoffOverride ?? defaultCutoffValue;
  const [dateTouched, setDateTouched] = useState(false);
  const [category, setCategory] = useState<SocialCategory>("UR");
  const [pwbdBaseCategory, setPwbdBaseCategory] = useState<PwbdBaseCategory>("UR");
  const [domicileState, setDomicileState] = useState("");
  const [qualification, setQualification] = useState<Qualification>("ALL");
  const [activeTab, setActiveTab] = useState<"central" | "state">("central");

  const { calculation, error } = useMemo(() => {
    const invalidDateError: CalculatorError = {
      title: "Incomplete date format",
      message: "Incomplete date format.",
      nextStep: "Please select full Day, Month, and Year values.",
    };

    if (!dobValue || !cutoffValue) {
      return {
        calculation: null,
        error: dateTouched ? invalidDateError : null,
      };
    }

    try {
      const dob = parseLocalDate(dobValue);
      const cutoff = parseLocalDate(cutoffValue);
      if (!dob || !cutoff) {
        return { calculation: null, error: invalidDateError };
      }
      if (calculatorMode === "age" && (cutoff.getFullYear() < 1990 || cutoff.getFullYear() > 2035)) {
        return {
          calculation: null,
          error: {
            title: "Cutoff date outside standard exam cycles",
            message: "Cutoff date outside standard exam cycles.",
            nextStep: "Choose a cutoff date between 1990 and 2035 (e.g., 1st August 2026).",
          },
        };
      }
      if (dob > cutoff) {
        return {
          calculation: null,
          error: {
            title: calculatorMode === "age" ? "Date of Birth in Future" : "Start Date in Future",
            message: calculatorMode === "age"
              ? "Date of Birth cannot be after the cutoff date."
              : "The experience start date cannot be after the end date.",
            nextStep: "Please select valid dates in chronological order.",
          },
        };
      }

      const age = calculateExactAge(dob, cutoff);
      if (calculatorMode === "experience") {
        return {
          calculation: {
            age,
            cutoffDate: cutoff,
            startDate: dob,
            eligibility: null,
          },
          error: null,
        };
      }

      const eligibility = evaluateEligibility(
        age,
        category,
        domicileState || null,
        qualification,
        dob,
        cutoff,
        pwbdBaseCategory,
      );
      return {
        calculation: {
          age,
          cutoffDate: cutoff,
          startDate: dob,
          eligibility,
        },
        error: null,
      };
    } catch (caughtError) {
      console.error("Exam age calculation failed.", caughtError);
      return {
        calculation: null,
        error: {
          title: calculatorMode === "age" ? "Unable to calculate age and eligibility" : "Unable to calculate experience",
          message: "The selected dates could not be calculated safely.",
          nextStep: "Check the dates and try again.",
        },
      };
    }
  }, [calculatorMode, category, cutoffValue, dateTouched, dobValue, domicileState, qualification, pwbdBaseCategory]);

  const dob = useMemo(() => {
    try {
      return dobValue ? parseLocalDate(dobValue) : null;
    } catch (caughtError) {
      console.error("Date of birth parsing failed.", caughtError);
      return null;
    }
  }, [dobValue]);
  const selectedTabResults = calculation?.eligibility
    ? activeTab === "central"
      ? calculation.eligibility.central
      : calculation.eligibility.state
    : [];

  return (
    <section className={styles.calculator} aria-labelledby="exam-age-heading">
      <div className={styles.intro}>
        <div>
          <h2 id="exam-age-heading">Calculate age, eligibility &amp; experience</h2>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.calendarSwitch} role="group" aria-label="Calculator mode">
          <button
            className={calculatorMode === "age" ? styles.active : ""}
            type="button"
            aria-pressed={calculatorMode === "age"}
            onClick={() => setCalculatorMode("age")}
          >
            Age &amp; exam eligibility
          </button>
          <button
            className={calculatorMode === "experience" ? styles.active : ""}
            type="button"
            aria-pressed={calculatorMode === "experience"}
            onClick={() => setCalculatorMode("experience")}
          >
            Work experience
          </button>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            {calculatorMode === "age" ? "Date of birth" : "Experience start date"}
            <input
              id="start-date-input"
              type="date"
              value={dobValue}
              max={toLocalDateInputValue(new Date())}
              onChange={(event) => {
                setDobOverride(event.target.value);
                setDateTouched(true);
              }}
              aria-label={calculatorMode === "age" ? "Date of birth" : "Experience start date"}
            />
            <span className={styles.fieldHint}>
              {dob ? formatDate(dob) : "Select a complete date."}
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="cutoff-date">
              {calculatorMode === "age" ? "Exam cutoff date" : "Experience end date"}
            </label>
            <input
              id="cutoff-date"
              type="date"
              value={cutoffValue}
              max={calculatorMode === "experience" ? toLocalDateInputValue(new Date()) : undefined}
              onChange={(event) => {
                setCutoffOverride(event.target.value);
                setDateTouched(true);
              }}
              aria-label="Exam cutoff date"
            />
          </div>
        </div>

        {calculatorMode === "age" && <div className={styles.optional}>
          <p className={styles.optionalHeading}>
            Check Sarkari exam Eligibility
          </p>
          <div className={styles.optionalFields}>
            <label className={styles.field}>
              Social category
              <select value={category} onChange={(event) => setCategory(event.target.value as SocialCategory)}>
                <option value="UR">UR / General</option>
                <option value="EWS">EWS</option>
                <option value="OBC">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="PwBD">PwBD</option>
              </select>
            </label>
            {category === "PwBD" && (
              <label className={styles.field}>
                PwBD base category
                <select
                  value={pwbdBaseCategory}
                  onChange={(event) => setPwbdBaseCategory(event.target.value as PwbdBaseCategory)}
                >
                  <option value="UR">General (+10 years)</option>
                  <option value="OBC">OBC (+13 years)</option>
                  <option value="SC_ST">SC / ST (+15 years)</option>
                </select>
              </label>
            )}
            <label className={styles.field}>
              Domicile state
              <select value={domicileState} onChange={(event) => setDomicileState(event.target.value)}>
                <option value="">All India / not selected</option>
                {examStates.map((state) => <option value={state} key={state}>{state}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              Minimum qualification
              <select
                value={qualification}
                onChange={(event) => setQualification(event.target.value as Qualification)}
              >
                <option value="ALL">All</option>
                <option value="10TH">10th pass</option>
                <option value="12TH">12th pass</option>
                <option value="GRADUATE">Graduate</option>
                <option value="POST_GRADUATE">Post-graduate</option>
              </select>
            </label>
          </div>
          {category === "UR" && (
            <p className={styles.helper}>
              Showing General (UR) eligibility. Select a category to check reservation relaxations.
            </p>
          )}
        </div>}
      </div>

      {error && <ErrorAlert error={error} />}

      {calculation && (
        <div className={styles.results} aria-live="polite">
          <div className={styles.summary}>
            <div>
              <p className={styles.summaryLabel}>
                {calculatorMode === "age" ? "Exact age" : "Experience duration"} on{" "}
                {formatDate(calculation.cutoffDate)} ·{" "}
                {calculatorMode === "age" ? "DOB" : "Start date"} {formatDate(calculation.startDate)}
              </p>
              <p className={styles.age}>{ageMessage(calculation.age)}</p>
              <div className={styles.summaryMeta}>
                {calculatorMode === "age" ? (
                  <span className={styles.pill}>
                    Evaluated under {categoryLabels[category]} norms
                    {getRelaxation(category, pwbdBaseCategory) > 0 &&
                      ` (+${getRelaxation(category, pwbdBaseCategory)} years modeled)`}
                  </span>
                ) : <span className={styles.pill}>Work experience duration</span>}
              </div>
            </div>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => {
                document.getElementById("start-date-input")?.focus();
                document.getElementById("exam-age-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Edit inputs
            </button>
          </div>

          {calculatorMode === "age" && calculation.eligibility && <div className={styles.tabs}>
            <div className={styles.tabList} role="tablist" aria-label="Exam eligibility results">
              <button
                type="button"
                role="tab"
                id="central-tab"
                aria-selected={activeTab === "central"}
                aria-controls="central-results"
                className={activeTab === "central" ? styles.active : ""}
                onClick={() => setActiveTab("central")}
              >
                PAN-India Central Government Jobs
              </button>
              <button
                type="button"
                role="tab"
                id="state-tab"
                aria-selected={activeTab === "state"}
                aria-controls="state-results"
                className={activeTab === "state" ? styles.active : ""}
                onClick={() => setActiveTab("state")}
              >
                State Government Jobs
              </button>
            </div>
            {activeTab === "state" && !calculation.eligibility.domicileSelected && (
              <p className={styles.stateNotice}>
                Showing state exam baselines across listed states without applying a domicile quota.
                Select your domicile to narrow results; state-specific reservation rules vary by notice.
              </p>
            )}
            <div
              id={activeTab === "central" ? "central-results" : "state-results"}
              role="tabpanel"
              aria-labelledby={activeTab === "central" ? "central-tab" : "state-tab"}
            >
              {selectedTabResults.length > 0 &&
                selectedTabResults.every((result) => result.status === "UNDER_AGE") && (
                  <div className={styles.alert} role="status">
                    <strong>Age calculated, but below exam eligibility age</strong>
                    <p>Your age is shown above. You are below the minimum age for the listed exams in this result set.</p>
                  </div>
                )}
              <ExamEligibilityCards results={selectedTabResults} />
            </div>
            <p className={styles.disclaimer}>
              Estimates only — actual age cutoffs, category relaxations, qualifications and domicile rules
              differ by post and notification. Check the official notice linked on each card before applying.
            </p>
          </div>}
        </div>
      )}
      {!compact && (
        <div className={styles.fieldHint} style={{ padding: "0 28px 18px" }}>
          Age, experience, and eligibility calculations stay on this device.
        </div>
      )}
    </section>
  );
}

"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import {
  evaluateEligibility,
  examStates,
} from "@/lib/constants/governmentExamsData";
import {
  calculateExactAge,
  parseLocalDate,
  toLocalDateInputValue,
} from "@/lib/utils/dateMath";
import type { BirthLocation } from "@/lib/utils/hinduLunarCalendar";
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

const hinduMasaNames = [
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashvina",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
];

type CitySearchResponse = {
  results?: BirthLocation[];
  error?: string;
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
  const dobValue = dobOverride ?? "";
  const cutoffValue = cutoffOverride ?? defaultCutoffValue;
  const [dateTouched, setDateTouched] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"gregorian" | "hindu">("gregorian");
  const [hinduYear, setHinduYear] = useState(String(new Date().getFullYear() - 30 + 57));
  const [hinduMasa, setHinduMasa] = useState(0);
  const [adhikaMasa, setAdhikaMasa] = useState(false);
  const [hinduPaksha, setHinduPaksha] = useState<"Shukla" | "Krishna">("Shukla");
  const [hinduTithi, setHinduTithi] = useState(1);
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [cityResults, setCityResults] = useState<BirthLocation[]>([]);
  const [birthLocation, setBirthLocation] = useState<BirthLocation | null>(null);
  const [citySearchPending, setCitySearchPending] = useState(false);
  const [conversionPending, setConversionPending] = useState(false);
  const [conversionError, setConversionError] = useState<CalculatorError | null>(null);
  const [dateCandidates, setDateCandidates] = useState<string[]>([]);
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
      if (cutoff.getFullYear() < 1990 || cutoff.getFullYear() > 2035) {
        return {
          calculation: null,
          error: {
            title: "Cutoff date outside standard exam cycles",
            message: "Cutoff date outside standard exam cycles.",
            nextStep: "Choose a cutoff date between 1990 and 2035 (e.g., 1st August 2026).",
          },
        };
      }
      if (dob >= cutoff) {
        return {
          calculation: null,
          error: {
            title: "Date of Birth in Future or Matches Cutoff",
            message: "Date of Birth cannot be the same as or after the Cutoff Date.",
            nextStep: "Please select a valid past birth date.",
          },
        };
      }

      const age = calculateExactAge(dob, cutoff);
      if (age.years < 14) {
        return {
          calculation: null,
          error: {
            title: "Age Below 14 Years",
            message: "Age is below the minimum legal threshold for government recruitment.",
            nextStep: "Please enter a valid Date of Birth for candidates aged 14 years and older.",
          },
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
          eligibility,
        },
        error: null,
      };
    } catch (caughtError) {
      console.error("Exam age calculation failed.", caughtError);
      return {
        calculation: null,
        error: {
          title: "Unable to calculate eligibility",
          message: "The selected dates could not be calculated safely.",
          nextStep: "Check the dates and try again.",
        },
      };
    }
  }, [category, cutoffValue, dateTouched, dobValue, domicileState, qualification, pwbdBaseCategory]);

  async function searchBirthCity() {
    setCitySearchPending(true);
    setConversionError(null);
    setCityResults([]);
    setBirthLocation(null);
    try {
      const response = await fetch(`/api/geocode/cities?name=${encodeURIComponent(birthCity.trim())}`);
      const data = (await response.json()) as CitySearchResponse;
      if (!response.ok) throw new Error(data.error ?? "City lookup failed.");
      const results = data.results ?? [];
      if (results.length === 0) throw new Error("No matching city was found. Check the spelling and try again.");
      setCityResults(results);
      if (results.length === 1) setBirthLocation(results[0]);
    } catch (caughtError) {
      console.error("Birth city lookup failed.", caughtError);
      setConversionError({
        title: "Unable to find the birth city",
        message: caughtError instanceof Error ? caughtError.message : "The city lookup could not be completed.",
        nextStep: "Check the city name and retry. Your date-of-birth fields are not sent to the lookup service.",
      });
    } finally {
      setCitySearchPending(false);
    }
  }

  async function convertHinduBirthDate() {
    const year = Number(hinduYear);
    if (!Number.isSafeInteger(year) || year < 1957 || year > new Date().getFullYear() + 57) {
      setConversionError({
        title: "Invalid Vikram Samvat year",
        message: "Enter a valid Vikram Samvat year.",
        nextStep: "Use a year from 1957 through the current Gregorian year plus 57.",
      });
      return;
    }
    if (!birthLocation) {
      setConversionError({
        title: "Select your birth city",
        message: "The city is needed to determine the local timezone and sunrise.",
        nextStep: "Search for your birth city and select the correct result first.",
      });
      return;
    }

    setConversionPending(true);
    setConversionError(null);
    setDateCandidates([]);
    try {
      const { resolveHinduLunarBirthDate } = await import("@/lib/utils/hinduLunarCalendar");
      const matches = resolveHinduLunarBirthDate({
        samvatYear: year,
        masaIndex: hinduMasa,
        adhikaMasa,
        paksha: hinduPaksha,
        tithi: hinduTithi,
        birthTime: birthTime || undefined,
        location: birthLocation,
      }).filter((date) => date <= getTodayDateValue());

      if (matches.length === 0) {
        throw new Error(
          "No matching past Gregorian date was found. The chosen tithi may be skipped at sunrise, or the year, month, city, or birth-time convention may differ.",
        );
      }
      setDateCandidates(matches);
      if (matches.length === 1) {
        setDobOverride(matches[0]);
        setDateTouched(true);
      }
    } catch (caughtError) {
      console.error("Hindu lunar date conversion failed.", caughtError);
      setConversionError({
        title: "Unable to resolve this Panchang date",
        message: caughtError instanceof Error ? caughtError.message : "The selected lunar date could not be converted.",
        nextStep: "Confirm the Vikram Samvat year, Purnimanta month, paksha, tithi, and birth city, then try again.",
      });
    } finally {
      setConversionPending(false);
    }
  }

  const dob = useMemo(() => {
    try {
      return dobValue ? parseLocalDate(dobValue) : null;
    } catch (caughtError) {
      console.error("Date of birth parsing failed.", caughtError);
      return null;
    }
  }, [dobValue]);
  const selectedTabResults = calculation
    ? activeTab === "central"
      ? calculation.eligibility.central
      : calculation.eligibility.state
    : [];

  return (
    <section className={styles.calculator} aria-labelledby="exam-age-heading">
      <div className={styles.intro}>
        <div>
          <h2 id="exam-age-heading">Calculate age &amp; eligibility</h2>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.calendarSwitch} role="group" aria-label="Date calendar mode">
          <button
            className={calendarMode === "gregorian" ? styles.active : ""}
            type="button"
            aria-pressed={calendarMode === "gregorian"}
            onClick={() => setCalendarMode("gregorian")}
          >
            Gregorian (English)
          </button>
          <button
            className={calendarMode === "hindu" ? styles.active : ""}
            type="button"
            aria-pressed={calendarMode === "hindu"}
            onClick={() => setCalendarMode("hindu")}
          >
            Hindu lunar Panchang
          </button>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            Date of birth
            {calendarMode === "gregorian" ? (
              <input
                id="dob-input"
                type="date"
                value={dobValue}
                max={toLocalDateInputValue(new Date())}
                onChange={(event) => {
                  setDobOverride(event.target.value);
                  setDateTouched(true);
                }}
                aria-label="Date of birth"
              />
            ) : (
              <div className={styles.hinduFields}>
                <label className={styles.field}>
                  Vikram Samvat year
                  <input
                    type="number"
                    min="1957"
                    max={new Date().getFullYear() + 57}
                    value={hinduYear}
                    onChange={(event) => setHinduYear(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  Purnimanta month
                  <select value={hinduMasa} onChange={(event) => setHinduMasa(Number(event.target.value))}>
                    {hinduMasaNames.map((masa, index) => <option value={index} key={masa}>{masa}</option>)}
                  </select>
                </label>
                <label className={styles.adhikaChoice}>
                  <input
                    type="checkbox"
                    checked={adhikaMasa}
                    onChange={(event) => setAdhikaMasa(event.target.checked)}
                  />
                  This is an Adhika (intercalary) month
                </label>
                <label className={styles.field}>
                  Paksha
                  <select
                    value={hinduPaksha}
                    onChange={(event) => setHinduPaksha(event.target.value as "Shukla" | "Krishna")}
                  >
                    <option value="Shukla">Shukla (bright half)</option>
                    <option value="Krishna">Krishna (dark half)</option>
                  </select>
                </label>
                <label className={styles.field}>
                  Tithi
                  <select value={hinduTithi} onChange={(event) => setHinduTithi(Number(event.target.value))}>
                    {Array.from({ length: 15 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index === 14
                          ? hinduPaksha === "Shukla" ? "15 — Purnima" : "15 — Amavasya"
                          : `${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  Birth city
                  <input
                    value={birthCity}
                    maxLength={120}
                    onChange={(event) => {
                      setBirthCity(event.target.value);
                      setBirthLocation(null);
                      setCityResults([]);
                    }}
                    placeholder="e.g. Patna, Bihar"
                  />
                </label>
                <button
                  className={styles.cityButton}
                  type="button"
                  disabled={citySearchPending || birthCity.trim().length < 2}
                  onClick={searchBirthCity}
                >
                  {citySearchPending ? "Finding city..." : "Find city"}
                </button>
                {cityResults.length > 0 && (
                  <label className={styles.field}>
                    Select matching city
                    <select
                      value={birthLocation ? `${birthLocation.latitude},${birthLocation.longitude}` : ""}
                      onChange={(event) => {
                        const selected = cityResults.find(
                          (place) => `${place.latitude},${place.longitude}` === event.target.value,
                        );
                        setBirthLocation(selected ?? null);
                      }}
                    >
                      <option value="">Choose a city result</option>
                      {cityResults.map((place) => (
                        <option key={`${place.latitude},${place.longitude}`} value={`${place.latitude},${place.longitude}`}>
                          {[place.name, place.admin1, place.country].filter(Boolean).join(", ")}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className={styles.field}>
                  Birth time <span>(optional)</span>
                  <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} />
                </label>
                <button
                  className={styles.convertButton}
                  type="button"
                  disabled={conversionPending || !birthLocation}
                  onClick={convertHinduBirthDate}
                >
                  {conversionPending ? "Calculating..." : "Convert Hindu date"}
                </button>
                <p className={styles.calendarNote}>
                  If time is unknown, tithi is checked at local sunrise. City name is used only to find
                  coordinates/time zone; calendar calculations stay in this browser.
                </p>
              </div>
            )}
            <span className={styles.fieldHint}>
              {dob
                ? `${formatDate(dob)} · Gregorian date used for age calculation`
                : calendarMode === "gregorian" ? "Select a complete date." : "Choose a lunar date and birth city, then convert."}
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="cutoff-date">Exam cutoff date</label>
            <input
              id="cutoff-date"
              type="date"
              value={cutoffValue}
              onChange={(event) => {
                setCutoffOverride(event.target.value);
                setDateTouched(true);
              }}
              aria-label="Exam cutoff date"
            />
          </div>
        </div>

        <div className={styles.optional}>
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
        </div>
      </div>

      {conversionError && <ErrorAlert error={conversionError} />}
      {dateCandidates.length > 1 && (
        <div className={styles.candidateList} aria-live="polite">
          <strong>This lunar tithi occurred at sunrise on more than one date.</strong>
          <span>Select the Gregorian birth date that matches your records:</span>
          {dateCandidates.map((date) => (
            <button
              type="button"
              key={date}
              onClick={() => {
                setDobOverride(date);
                setDateTouched(true);
              }}
            >
              {formatDate(parseLocalDate(date)!)}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorAlert error={error} />}

      {calculation && (
        <div className={styles.results} aria-live="polite">
          <div className={styles.summary}>
            <div>
              <p className={styles.summaryLabel}>
                Exact age on {formatDate(calculation.cutoffDate)} · DOB {formatDate(dob!)}
              </p>
              <p className={styles.age}>{ageMessage(calculation.age)}</p>
              <div className={styles.summaryMeta}>
                <span className={styles.pill}>
                  Evaluated under {categoryLabels[category]} norms
                  {getRelaxation(category, pwbdBaseCategory) > 0 &&
                    ` (+${getRelaxation(category, pwbdBaseCategory)} years modeled)`}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => {
                document.getElementById("dob-input")?.focus();
                document.getElementById("exam-age-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Edit inputs
            </button>
          </div>

          <div className={styles.tabs}>
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
              <ExamEligibilityCards results={selectedTabResults} />
            </div>
            <p className={styles.disclaimer}>
              Estimates only — actual age cutoffs, category relaxations, qualifications and domicile rules
              differ by post and notification. Check the official notice linked on each card before applying.
              Hindu lunar-date conversion is an astronomical estimate; regional Panchang conventions may differ.
            </p>
          </div>
        </div>
      )}
      {!compact && (
        <div className={styles.fieldHint} style={{ padding: "0 28px 18px" }}>
          <CalendarDays size={13} aria-hidden="true" /> DOB and calendar calculations stay on this device; only the entered city is used for lookup.
        </div>
      )}
    </section>
  );
}

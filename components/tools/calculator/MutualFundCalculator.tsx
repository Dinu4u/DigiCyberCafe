"use client";

import { useMemo, useState } from "react";
import {
  calculateInvestmentGrowth,
  InvestmentCalculationError,
} from "@/lib/utils/investmentMath";
import type {
  InvestmentInputs,
  InvestmentMode,
  LumpsumFrequency,
} from "@/types/investmentCalculator";
import { formatInvestmentCurrency, InvestmentGrowthTable } from "./InvestmentGrowthTable";
import styles from "./MutualFundCalculator.module.css";

type ChartSegment = "invested" | "returns";

type CalculatorError = {
  title: string;
  message: string;
  nextStep: string;
};

const frequencyOptions: { value: LumpsumFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Every Month" },
  { value: "QUARTERLY", label: "Quarterly (Every 3 Months)" },
  { value: "HALF_YEARLY", label: "Half-Yearly (Every 6 Months)" },
  { value: "YEARLY", label: "Yearly (Every 12 Months)" },
];

const modeOptions: { value: InvestmentMode; label: string }[] = [
  { value: "SIP", label: "Monthly SIP" },
  { value: "LUMPSUM", label: "One-Time Lumpsum" },
  { value: "HYBRID", label: "SIP + Lumpsum" },
];

function getCalculatorError(error: unknown): CalculatorError {
  if (!(error instanceof InvestmentCalculationError)) {
    console.error("Mutual fund calculator failed.", error);
    return {
      title: "Calculation unavailable",
      message: "The projection could not be calculated safely.",
      nextStep: "Check your inputs and try again.",
    };
  }

  switch (error.code) {
    case "INVALID_AMOUNT":
    case "INVALID_TENURE":
      return {
        title: "Negative or Zero Inputs",
        message: "Invalid investment parameter.",
        nextStep: "Please ensure investment amounts, expected return rate, and time horizon are positive numbers.",
      };
    case "INVALID_RATE":
      return {
        title: "Unrealistic Return Rate",
        message: "Return rate outside standard market projections.",
        nextStep: "Standard mutual funds typically project between 6% and 18% annual CAGR. Please choose an annual return rate within 1% to 30%.",
      };
    case "RATE_OUT_OF_RANGE":
      return {
        title: "Unrealistic Return Rate",
        message: "Return rate outside standard market projections.",
        nextStep: "Standard mutual funds typically project between 6% and 18% annual CAGR. Please choose an annual return rate within 1% to 30%.",
      };
    case "TENURE_OUT_OF_RANGE":
      return {
        title: "Exceeded Tenure Limits",
        message: "Tenure out of valid bounds.",
        nextStep: "Please select an investment horizon between 1 year and 40 years.",
      };
    case "OVERFLOW":
      return {
        title: "Calculation Overflow",
        message: "Calculated maturity value exceeds displayable limits.",
        nextStep: "Please reduce the tenure or investment amount to view accurate projections.",
      };
  }
}

function ErrorAlert({ error }: { error: CalculatorError }) {
  return (
    <div className={styles.errorAlert} role="alert">
      <strong>{error.title}</strong>
      <p>{error.message}</p>
      <p>{error.nextStep}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
}) {
  const inputId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-number`;

  function updateValue(nextValue: number) {
    try {
      onChange(nextValue);
    } catch (error) {
      console.error(`Could not update ${label}.`, error);
    }
  }

  return (
    <label className={styles.field}>
      <span className={styles.fieldTitle}>
        <span>{label}</span>
        <span className={styles.fieldValue}>{formatValue(value)}</span>
      </span>
      <input
        id={inputId}
        type="number"
        className={styles.numberInput}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => updateValue(event.target.value === "" ? 0 : Number(event.target.value))}
      />
      <input
        type="range"
        id={`${inputId}-slider`}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min}
        onChange={(event) => updateValue(Number(event.target.value))}
        aria-label={`${label} slider`}
      />
      <span className={styles.bounds}>
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </span>
    </label>
  );
}

export function MutualFundCalculator() {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    mode: "SIP",
    sipAmount: 10_000,
    lumpsumAmount: 100_000,
    frequency: "QUARTERLY",
    annualReturnRate: 12,
    tenureYears: 10,
  });
  const [copyMessage, setCopyMessage] = useState("");
  const [hoveredSegment, setHoveredSegment] = useState<ChartSegment | null>(null);

  const calculation = useMemo(() => {
    try {
      return {
        result: calculateInvestmentGrowth(inputs),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: getCalculatorError(error),
      };
    }
  }, [inputs]);

  const investedPercent = calculation.result
    ? Math.min(100, Math.max(0, (calculation.result.totalInvested / calculation.result.futureValue) * 100))
    : 0;
  const chartSegment = hoveredSegment;
  const chartValue = calculation.result
    ? chartSegment === "invested"
      ? calculation.result.totalInvested
      : chartSegment === "returns"
        ? calculation.result.wealthGained
        : calculation.result.futureValue
    : 0;
  const chartLabel = chartSegment === "invested"
    ? "Invested capital"
    : chartSegment === "returns"
      ? "Estimated returns"
      : "Projected value";
  const chartPercent = chartSegment === "invested"
    ? investedPercent
    : chartSegment === "returns"
      ? 100 - investedPercent
      : null;
  const ringCircumference = 2 * Math.PI * 70;
  const investedArcLength = ringCircumference * investedPercent / 100;
  const returnsArcLength = ringCircumference - investedArcLength;

  function updateInput<K extends keyof InvestmentInputs>(
    key: K,
    value: InvestmentInputs[K],
  ) {
    try {
      setInputs((current) => ({ ...current, [key]: value }));
      setCopyMessage("");
    } catch (error) {
      console.error("Could not update investment input.", error);
    }
  }

  async function copySummary() {
    if (!calculation.result) return;
    try {
      const summary = [
        "Mutual Fund Investment Projection",
        `Mode: ${inputs.mode}`,
        `Total invested: ${formatInvestmentCurrency(calculation.result.totalInvested)}`,
        `Estimated wealth gained: ${formatInvestmentCurrency(calculation.result.wealthGained)}`,
        `Estimated future value: ${formatInvestmentCurrency(calculation.result.futureValue)}`,
        `Expected annual return: ${inputs.annualReturnRate}%`,
        `Time horizon: ${inputs.tenureYears} years`,
        "Illustration only; mutual fund returns are market-linked and not guaranteed.",
      ].join("\n");
      await navigator.clipboard.writeText(summary);
      setCopyMessage("Summary copied.");
    } catch (error) {
      console.error("Could not copy investment summary.", error);
      setCopyMessage("Copy failed. Select and copy the figures manually.");
    }
  }

  return (
    <section className={styles.calculator} aria-labelledby="mutual-fund-calculator-title">
      <div className={styles.heading}>
        <h1 id="mutual-fund-calculator-title">Mutual Fund Calculator</h1>
        <p>Estimate SIP, one-time lumpsum, or combined investment growth.</p>
      </div>

      {calculation.error && <ErrorAlert error={calculation.error} />}

      <div className={styles.layout}>
        <div className={styles.inputs}>
          <div className={styles.modeSwitch} role="group" aria-label="Investment mode">
            {modeOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={inputs.mode === option.value ? styles.active : ""}
                aria-pressed={inputs.mode === option.value}
                onClick={() => updateInput("mode", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {inputs.mode !== "LUMPSUM" && (
            <InputField
              label="Monthly SIP amount"
              value={inputs.sipAmount}
              min={500}
              max={200_000}
              step={500}
              onChange={(value) => updateInput("sipAmount", value)}
              formatValue={formatInvestmentCurrency}
            />
          )}

          {inputs.mode !== "SIP" && (
            <InputField
              label={inputs.mode === "LUMPSUM" ? "One-time lumpsum amount" : "Periodic lumpsum amount"}
              value={inputs.lumpsumAmount}
              min={5_000}
              max={1_000_000}
              step={5_000}
              onChange={(value) => updateInput("lumpsumAmount", value)}
              formatValue={formatInvestmentCurrency}
            />
          )}

          {inputs.mode === "HYBRID" && (
            <label className={styles.field}>
              Lumpsum top-up frequency
              <select
                className={styles.frequency}
                value={inputs.frequency}
                onChange={(event) => updateInput("frequency", event.target.value as LumpsumFrequency)}
              >
                {frequencyOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}

          <InputField
            label="Expected return rate (CAGR)"
            value={inputs.annualReturnRate}
            min={1}
            max={30}
            step={0.5}
            onChange={(value) => updateInput("annualReturnRate", value)}
            formatValue={(value) => `${value}%`}
          />

          <InputField
            label="Time horizon"
            value={inputs.tenureYears}
            min={1}
            max={40}
            step={1}
            onChange={(value) => updateInput("tenureYears", value)}
            formatValue={(value) => `${value} ${value === 1 ? "year" : "years"}`}
          />
        </div>

        {calculation.result && (
          <div className={styles.results} aria-live="polite">
            <div className={styles.resultChart}>
              <svg
                className={styles.donut}
                viewBox="0 0 168 168"
                role="group"
                aria-label="Interactive investment breakdown chart"
              >
                <circle
                  className={`${styles.chartArc} ${styles.returnsArc} ${chartSegment === "returns" ? styles.highlightedArc : ""}`}
                  cx="84"
                  cy="84"
                  r="70"
                  strokeDasharray={`${returnsArcLength} ${ringCircumference}`}
                  strokeDashoffset={-investedArcLength}
                  transform="rotate(-90 84 84)"
                  role="img"
                  tabIndex={0}
                  aria-label={`Estimated returns: ${formatInvestmentCurrency(calculation.result.wealthGained)}, ${Math.round(100 - investedPercent)} percent.`}
                  onMouseEnter={() => setHoveredSegment("returns")}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onFocus={() => setHoveredSegment("returns")}
                  onBlur={() => setHoveredSegment(null)}
                />
                <circle
                  className={`${styles.chartArc} ${styles.investedArc} ${chartSegment === "invested" ? styles.highlightedArc : ""}`}
                  cx="84"
                  cy="84"
                  r="70"
                  strokeDasharray={`${investedArcLength} ${ringCircumference}`}
                  transform="rotate(-90 84 84)"
                  role="img"
                  tabIndex={0}
                  aria-label={`Invested capital: ${formatInvestmentCurrency(calculation.result.totalInvested)}, ${Math.round(investedPercent)} percent.`}
                  onMouseEnter={() => setHoveredSegment("invested")}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onFocus={() => setHoveredSegment("invested")}
                  onBlur={() => setHoveredSegment(null)}
                />
                <foreignObject x="28" y="28" width="112" height="112" pointerEvents="none">
                  <div className={styles.donutCenter} aria-live="polite">
                    <span>{chartLabel}{chartPercent === null ? "" : ` · ${Math.round(chartPercent)}%`}</span>
                    <strong>{formatInvestmentCurrency(chartValue)}</strong>
                  </div>
                </foreignObject>
              </svg>
              <div className={styles.chartLegend} aria-label="Investment chart values">
                <span
                  tabIndex={0}
                  role="img"
                  aria-label={`Invested capital ${Math.round(investedPercent)} percent`}
                  className={chartSegment === "invested" ? styles.activeLegend : ""}
                  onMouseEnter={() => setHoveredSegment("invested")}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onFocus={() => setHoveredSegment("invested")}
                  onBlur={() => setHoveredSegment(null)}
                >
                  <i className={styles.investedDot} /> Invested capital
                </span>
                <strong>{Math.round(investedPercent)}%</strong>
                <span
                  tabIndex={0}
                  role="img"
                  aria-label={`Estimated returns ${Math.round(100 - investedPercent)} percent`}
                  className={chartSegment === "returns" ? styles.activeLegend : ""}
                  onMouseEnter={() => setHoveredSegment("returns")}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onFocus={() => setHoveredSegment("returns")}
                  onBlur={() => setHoveredSegment(null)}
                >
                  <i className={styles.returnsDot} /> Estimated returns
                </span>
                <strong>{Math.round(100 - investedPercent)}%</strong>
              </div>
            </div>
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>Total invested</span>
              <strong className={styles.investedValue}>
                {formatInvestmentCurrency(calculation.result.totalInvested)}
              </strong>
            </div>
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>Estimated wealth gained</span>
              <strong className={styles.gainedValue}>
                {formatInvestmentCurrency(calculation.result.wealthGained)}
              </strong>
            </div>
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>Estimated future value</span>
              <strong className={styles.futureValue}>
                {formatInvestmentCurrency(calculation.result.futureValue)}
              </strong>
              <span className={styles.resultFootnote}>
                Projection assumes a steady return; actual mutual fund returns vary.
              </span>
            </div>
          </div>
        )}
      </div>
      {calculation.result && (
        <div className={styles.growthContainer}>
          <InvestmentGrowthTable
            rows={calculation.result.yearlyBreakdown}
            monthlyRows={calculation.result.monthlyBreakdown}
            inputs={inputs}
            onCopySummary={copySummary}
            copyMessage={copyMessage}
          />
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import type {
  InvestmentInputs,
  MonthlyInvestmentRecord,
  YearlyInvestmentRecord,
} from "@/types/investmentCalculator";
import styles from "./MutualFundCalculator.module.css";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInvestmentCurrency(value: number): string {
  return currency.format(Number.isFinite(value) && value >= 0 ? value : 0);
}

export function InvestmentGrowthTable({
  rows,
  monthlyRows,
  inputs,
  onCopySummary,
  copyMessage,
}: {
  rows: YearlyInvestmentRecord[];
  monthlyRows: MonthlyInvestmentRecord[];
  inputs: InvestmentInputs;
  onCopySummary: () => void;
  copyMessage: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [downloadError, setDownloadError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");

  async function downloadMonthlyProjection() {
    try {
      setDownloadError("");
      setDownloadStatus("");
      const XLSX = await import("@e965/xlsx");
      const rowsForSheet = monthlyRows.map((row) => ({
        Month: row.month,
        Year: row.year,
        "Month of year": row.monthOfYear,
        "Deposit (INR)": row.deposit,
        "Invested to date (INR)": row.investedToDate,
        "Estimated value (INR)": row.valueToDate,
        "Estimated returns (INR)": row.returnsToDate,
      }));
      const worksheet = XLSX.utils.json_to_sheet(rowsForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Projection");
      XLSX.writeFile(workbook, `mutual-fund-monthly-projection-${inputs.tenureYears}-years.xlsx`);
      setDownloadStatus("Monthly Excel projection downloaded.");
    } catch (error) {
      console.error("Could not create the monthly investment spreadsheet.", error);
      setDownloadError("Spreadsheet download failed. Please try again.");
    }
  }

  return (
    <section className={styles.growthSection}>
      <div className={styles.growthHeader}>
        <div>
          <h2>Investment growth breakdown</h2>
          <p>Track projected investment and returns over your selected period.</p>
        </div>
        <button type="button" className={styles.downloadButton} onClick={downloadMonthlyProjection}>
          Download monthly Excel
        </button>
      </div>

      <button
        className={styles.tableToggle}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "Hide" : "View"} year-by-year growth
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {downloadError && <p className={styles.downloadError} role="alert">{downloadError}</p>}
      {downloadStatus && <p className={styles.downloadStatus} role="status">{downloadStatus}</p>}

      {isOpen && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Invested to date</th>
                <th scope="col">Estimated value</th>
                <th scope="col">Estimated returns</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <th scope="row">Year {row.year}</th>
                  <td>{formatInvestmentCurrency(row.investedToDate)}</td>
                  <td>{formatInvestmentCurrency(row.valueToDate)}</td>
                  <td>{formatInvestmentCurrency(row.returnsToDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={styles.growthActions}>
        <button type="button" className={styles.copyButton} onClick={onCopySummary}>
          Copy summary
        </button>
        {copyMessage && <p className={styles.downloadStatus} role="status">{copyMessage}</p>}
      </div>
      <p className={styles.disclaimer}>
        For illustration only. Mutual fund investments are subject to market risks; returns are not guaranteed.
      </p>
    </section>
  );
}

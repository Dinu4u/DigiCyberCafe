import type { ExactAge } from "@/types/examEligibility";

function assertValidDate(date: Date, label: string): void {
  if (!(date instanceof Date) || !Number.isFinite(date.valueOf())) {
    throw new RangeError(`${label} must be a valid date.`);
  }
}

function daysFromCivil(year: number, month: number, day: number): number {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const shiftedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra;
}

export function calculateExactAge(dob: Date, cutoff: Date): ExactAge {
  assertValidDate(dob, "Date of birth");
  assertValidDate(cutoff, "Cutoff date");

  const dobYear = dob.getFullYear();
  const dobMonth = dob.getMonth();
  const dobDay = dob.getDate();
  const cutoffYear = cutoff.getFullYear();
  const cutoffMonth = cutoff.getMonth();
  const cutoffDay = cutoff.getDate();

  const totalDays =
    daysFromCivil(cutoffYear, cutoffMonth + 1, cutoffDay) -
    daysFromCivil(dobYear, dobMonth + 1, dobDay);
  if (totalDays < 0) {
    throw new RangeError("Cutoff date must be on or after the date of birth.");
  }

  let years = cutoffYear - dobYear;
  let months = cutoffMonth - dobMonth;
  let days = cutoffDay - dobDay;

  if (days < 0) {
    const daysInPreviousMonth = new Date(cutoffYear, cutoffMonth, 0).getDate();
    days += daysInPreviousMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  if (years < 0 || months < 0 || days < 0 || !Number.isSafeInteger(totalDays)) {
    throw new RangeError("Could not calculate a non-negative exact age.");
  }

  return { years, months, days, totalDays };
}

export function addMonthsClamped(date: Date, monthsToAdd: number): Date {
  assertValidDate(date, "Date");
  if (!Number.isSafeInteger(monthsToAdd)) {
    throw new RangeError("Month adjustment must be a whole number.");
  }

  const monthIndex = date.getMonth() + monthsToAdd;
  const targetYear = date.getFullYear() + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(
    targetYear,
    targetMonth,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toLocalDateInputValue(date: Date): string {
  assertValidDate(date, "Date");
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

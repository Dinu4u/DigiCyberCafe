import type { PanchangDetails } from "@/types/examEligibility";

const masaNames = [
  ["Chaitra", "चैत्र"],
  ["Vaishakha", "वैशाख"],
  ["Jyeshtha", "ज्येष्ठ"],
  ["Ashadha", "आषाढ़"],
  ["Shravana", "श्रावण"],
  ["Bhadrapada", "भाद्रपद"],
  ["Ashvina", "अश्विन"],
  ["Kartika", "कार्तिक"],
  ["Margashirsha", "मार्गशीर्ष"],
  ["Pausha", "पौष"],
  ["Magha", "माघ"],
  ["Phalguna", "फाल्गुन"],
] as const;

const seasons = [
  ["Vasanta", "वसंत"],
  ["Grishma", "ग्रीष्म"],
  ["Varsha", "वर्षा"],
  ["Sharad", "शरद"],
  ["Hemanta", "हेमंत"],
  ["Shishira", "शिशिर"],
] as const;

const tithiNames = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
] as const;

const tithiNamesHindi = [
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पंचमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "पूर्णिमा",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function sakaYearStartGregorian(sakaYear: number): Date {
  const gregorianYear = sakaYear + 78;
  return new Date(gregorianYear, 2, isLeapYear(gregorianYear) ? 21 : 22);
}

function sakaMonthLength(sakaYear: number, month: number): number {
  if (month === 1) return isLeapYear(sakaYear + 78) ? 31 : 30;
  return month >= 2 && month <= 6 ? 31 : 30;
}

function civilDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function getSakaMonthLength(sakaYear: number, month: number): number {
  if (!Number.isSafeInteger(sakaYear) || !Number.isSafeInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Saka year and month must be valid whole numbers.");
  }
  return sakaMonthLength(sakaYear, month);
}

export function getGregorianDateFromSaka(
  sakaYear: number,
  sakaMonth: number,
  sakaDay: number,
): Date {
  if (!Number.isSafeInteger(sakaYear) || !Number.isSafeInteger(sakaMonth) || !Number.isSafeInteger(sakaDay)) {
    throw new RangeError("Saka date values must be whole numbers.");
  }
  const monthLength = getSakaMonthLength(sakaYear, sakaMonth);
  if (sakaDay < 1 || sakaDay > monthLength) {
    throw new RangeError("Day is outside the selected Saka month.");
  }

  const dayOffset =
    Array.from({ length: sakaMonth - 1 }, (_, index) => sakaMonthLength(sakaYear, index + 1))
      .reduce((total, length) => total + length, 0) +
    sakaDay -
    1;
  const start = sakaYearStartGregorian(sakaYear);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOffset);
}

export function getHindiPanchangDetails(date: Date): PanchangDetails {
  if (!(date instanceof Date) || !Number.isFinite(date.valueOf())) {
    throw new RangeError("Panchang conversion requires a valid date.");
  }

  const year = date.getFullYear();
  const sakaNewYear = isLeapYear(year) ? 21 : 22;
  const hasEnteredChaitra = date.getMonth() > 2 || (date.getMonth() === 2 && date.getDate() >= sakaNewYear);
  const sakaYear = year - (hasEnteredChaitra ? 78 : 79);
  const samvatYear = year + (hasEnteredChaitra ? 57 : 56);

  const dayOffset = civilDayNumber(date) - civilDayNumber(sakaYearStartGregorian(sakaYear));
  let masaIndex = 0;
  let remainingDays = dayOffset;
  while (masaIndex < 11 && remainingDays >= sakaMonthLength(sakaYear, masaIndex + 1)) {
    remainingDays -= sakaMonthLength(sakaYear, masaIndex + 1);
    masaIndex += 1;
  }

  const elapsedDays = (civilDayNumber(date) - Math.floor(REFERENCE_NEW_MOON_UTC / DAY_MS));
  const lunarPhase = ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const tithiNumber = Math.min(30, Math.floor((lunarPhase / SYNODIC_MONTH_DAYS) * 30) + 1);
  const paksha = tithiNumber <= 15 ? "Shukla" : "Krishna";
  const pakshaTithi = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
  const tithiIndex = pakshaTithi - 1;
  const tithiEstimate =
    pakshaTithi === 15
      ? paksha === "Shukla"
        ? "Purnima (पूर्णिमा)"
        : "Amavasya (अमावस्या)"
      : `${tithiNames[tithiIndex]} (${tithiNamesHindi[tithiIndex]})`;

  const [masaName, masaNameHindi] = masaNames[masaIndex];
  const [ritu] = seasons[Math.floor(masaIndex / 2)];

  return {
    samvatYear,
    sakaYear,
    sakaMonth: masaIndex + 1,
    sakaDay: remainingDays + 1,
    masaName,
    masaNameHindi,
    ritu,
    paksha,
    tithiEstimate,
  };
}

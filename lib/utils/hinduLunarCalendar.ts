import {
  Body,
  EclipticLongitude,
  MoonPhase,
  Observer,
  SearchMoonPhase,
  SearchRiseSet,
} from "astronomy-engine";

const DAY_MS = 24 * 60 * 60 * 1000;
const MASA_NAMES = [
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
] as const;

export type BirthLocation = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  admin1?: string;
};

export type HinduBirthDateInput = {
  samvatYear: number;
  masaIndex: number;
  adhikaMasa: boolean;
  paksha: "Shukla" | "Krishna";
  tithi: number;
  birthTime?: string;
  location: BirthLocation;
};

type LocalDateParts = { year: number; month: number; day: number };

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function localDateTimeToUtc(
  parts: LocalDateParts,
  timeZone: string,
  hour = 0,
  minute = 0,
): Date {
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute);
  let utcMilliseconds = localAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getLocalDateParts(new Date(utcMilliseconds), timeZone);
    const actualLocalAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day);
    const targetDayAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
    const dayOffset = actualLocalAsUtc - targetDayAsUtc;
    const actualTime = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcMilliseconds));
    const actualHour = Number(actualTime.find((part) => part.type === "hour")?.value);
    const actualMinute = Number(actualTime.find((part) => part.type === "minute")?.value);
    const actualMinutes = dayOffset / 60_000 + actualHour * 60 + actualMinute;
    const targetMinutes = hour * 60 + minute;
    utcMilliseconds += (targetMinutes - actualMinutes) * 60_000;
  }

  return new Date(utcMilliseconds);
}

function dateString(parts: LocalDateParts): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addLocalDays(parts: LocalDateParts, days: number): LocalDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function sunriseForLocalDate(parts: LocalDateParts, location: BirthLocation): Date {
  const observer = new Observer(location.latitude, location.longitude, 0);
  const start = localDateTimeToUtc(parts, location.timezone);
  const sunrise = SearchRiseSet(Body.Sun, observer, +1, start, 1);
  if (!sunrise || dateString(getLocalDateParts(sunrise.date, location.timezone)) !== dateString(parts)) {
    throw new RangeError(`Sunrise could not be found for ${dateString(parts)} in ${location.name}.`);
  }
  return sunrise.date;
}

function lunarTithi(moment: Date): { paksha: "Shukla" | "Krishna"; tithi: number; phase: number } {
  const phase = ((MoonPhase(moment) % 360) + 360) % 360;
  const paksha = phase < 180 ? "Shukla" : "Krishna";
  const tithi = paksha === "Shukla"
    ? Math.min(15, Math.floor(phase / 12) + 1)
    : Math.min(15, Math.floor((phase - 180) / 12) + 1);
  return { paksha, tithi, phase };
}

function siderealSolarSign(moment: Date): number {
  const year = moment.getUTCFullYear() + moment.getUTCMonth() / 12;
  const lahiriAyanamsa = 23.8531 + ((year - 2000) * 0.013968);
  const longitude = ((EclipticLongitude(Body.Sun, moment) - lahiriAyanamsa) % 360 + 360) % 360;
  return Math.floor(longitude / 30);
}

function purnimantaMasa(moment: Date, phase: number): { index: number; adhika: boolean } {
  const fullMoonStart = phase < 180
    ? new Date(moment.getTime() + 1_000)
    : new Date(moment.getTime() - 30 * DAY_MS);
  const fullMoon = SearchMoonPhase(180, fullMoonStart, phase < 180 ? 20 : 35);
  if (!fullMoon) throw new RangeError("Could not determine the full moon for this lunar date.");
  const previousNewMoon = SearchMoonPhase(0, new Date(fullMoon.date.getTime() - 20 * DAY_MS), 30);
  if (!previousNewMoon) throw new RangeError("Could not determine the start of this lunar month.");
  const nextNewMoon = SearchMoonPhase(0, new Date(previousNewMoon.date.getTime() + DAY_MS), 35);
  if (!nextNewMoon) throw new RangeError("Could not determine the end of this lunar month.");
  const nextNewMoonBefore = new Date(nextNewMoon.date.getTime() - 1_000);
  return {
    index: (siderealSolarSign(fullMoon.date) + 1) % 12,
    adhika: siderealSolarSign(previousNewMoon.date) === siderealSolarSign(nextNewMoonBefore),
  };
}

function isChaitraShuklaPratipada(parts: LocalDateParts, location: BirthLocation): boolean {
  const sunrise = sunriseForLocalDate(parts, location);
  const { paksha, tithi, phase } = lunarTithi(sunrise);
  return paksha === "Shukla" && tithi === 1 && phase < 12 && purnimantaMasa(sunrise, phase).index === 0;
}

function chaitraStart(gregorianYear: number, location: BirthLocation): LocalDateParts {
  for (let month = 3; month <= 4; month += 1) {
    const daysInMonth = new Date(Date.UTC(gregorianYear, month, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const candidate = { year: gregorianYear, month, day };
      if (isChaitraShuklaPratipada(candidate, location)) return candidate;
    }
  }
  throw new RangeError(`Could not determine the Chaitra new year for ${gregorianYear}.`);
}

export function resolveHinduLunarBirthDate(input: HinduBirthDateInput): string[] {
  const { samvatYear, masaIndex, adhikaMasa, paksha, tithi, birthTime, location } = input;
  if (!Number.isSafeInteger(samvatYear) || samvatYear < 1957 || samvatYear > new Date().getFullYear() + 57) {
    throw new RangeError("Select a valid Vikram Samvat birth year.");
  }
  if (!Number.isInteger(masaIndex) || masaIndex < 0 || masaIndex > 11) {
    throw new RangeError("Select a valid Hindu lunar month.");
  }
  if (!Number.isInteger(tithi) || tithi < 1 || tithi > 15) {
    throw new RangeError("Select a tithi from 1 to 15.");
  }
  if (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
    throw new RangeError("Enter a valid local birth time.");
  }
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 ||
      !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) {
    throw new RangeError("Select a valid birth city.");
  }

  const firstYear = samvatYear - 57;
  const firstNewYear = chaitraStart(firstYear, location);
  const nextNewYear = chaitraStart(firstYear + 1, location);
  const matches: string[] = [];
  let parts = firstNewYear;

  while (Date.UTC(parts.year, parts.month - 1, parts.day) < Date.UTC(nextNewYear.year, nextNewYear.month - 1, nextNewYear.day)) {
    const sunrise = birthTime ? null : sunriseForLocalDate(parts, location);
    const moment = birthTime
      ? localDateTimeToUtc(parts, location.timezone, Number(birthTime.slice(0, 2)), Number(birthTime.slice(3, 5)))
      : sunrise!;
    const lunarDate = lunarTithi(moment);
    if (lunarDate.paksha !== paksha || lunarDate.tithi !== tithi) {
      parts = addLocalDays(parts, 1);
      continue;
    }
    const masa = purnimantaMasa(moment, lunarDate.phase);
    if (
      masa.index === masaIndex &&
      masa.adhika === adhikaMasa
    ) {
      matches.push(dateString(parts));
    }
    parts = addLocalDays(parts, 1);
  }

  return matches;
}

export function getHinduMasaNames(): readonly string[] {
  return MASA_NAMES;
}

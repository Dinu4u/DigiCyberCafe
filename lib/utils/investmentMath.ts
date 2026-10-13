import type {
  InvestmentCalculationErrorCode,
  InvestmentGrowthResult,
  InvestmentInputs,
} from "@/types/investmentCalculator";

const MONTHS_PER_YEAR = 12;
const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER;
const frequencyMonths = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
} as const;

export class InvestmentCalculationError extends RangeError {
  constructor(
    public readonly code: InvestmentCalculationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "InvestmentCalculationError";
  }
}

function assertFinitePositive(value: number, code: InvestmentCalculationErrorCode, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new InvestmentCalculationError(code, `${name} must be a positive finite number.`);
  }
}

function assertSafeValue(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > MAX_SAFE_VALUE) {
    throw new InvestmentCalculationError(
      "OVERFLOW",
      "Calculated investment value exceeds JavaScript's safe integer limit.",
    );
  }
}

export function calculateInvestmentGrowth(params: InvestmentInputs): InvestmentGrowthResult {
  const { mode, sipAmount, lumpsumAmount, frequency, annualReturnRate, tenureYears } = params;

  if (mode !== "SIP" && mode !== "LUMPSUM" && mode !== "HYBRID") {
    throw new InvestmentCalculationError("INVALID_AMOUNT", "Choose a valid investment mode.");
  }
  if (mode !== "LUMPSUM") {
    assertFinitePositive(sipAmount, "INVALID_AMOUNT", "Monthly SIP amount");
  }
  if (mode !== "SIP") {
    assertFinitePositive(lumpsumAmount, "INVALID_AMOUNT", "Lumpsum amount");
  }
  assertFinitePositive(annualReturnRate, "INVALID_RATE", "Expected return rate");
  if (annualReturnRate > 50) {
    throw new InvestmentCalculationError("INVALID_RATE", "Return rate must not exceed 50%.");
  }
  if (annualReturnRate < 1 || annualReturnRate > 30) {
    throw new InvestmentCalculationError(
      "RATE_OUT_OF_RANGE",
      "Expected return rate must be between 1% and 30%.",
    );
  }
  assertFinitePositive(tenureYears, "INVALID_TENURE", "Investment tenure");
  if (!Number.isInteger(tenureYears) || tenureYears < 1 || tenureYears > 40) {
    throw new InvestmentCalculationError(
      "TENURE_OUT_OF_RANGE",
      "Investment tenure must be a whole number between 1 and 40 years.",
    );
  }

  const totalMonths = tenureYears * MONTHS_PER_YEAR;
  const monthlyRate = annualReturnRate / 100 / MONTHS_PER_YEAR;
  const lumpFrequency = mode === "HYBRID" ? frequencyMonths[frequency] : 0;
  if (mode === "HYBRID" && !lumpFrequency) {
    throw new InvestmentCalculationError("INVALID_AMOUNT", "Choose a valid lumpsum frequency.");
  }

  let runningBalance = 0;
  let cumulativeInvested = 0;
  const yearlyBreakdown: InvestmentGrowthResult["yearlyBreakdown"] = [];
  const monthlyBreakdown: InvestmentGrowthResult["monthlyBreakdown"] = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    let currentDeposit = mode === "LUMPSUM" ? 0 : sipAmount;
    if (mode === "LUMPSUM" && month === 1) currentDeposit += lumpsumAmount;
    if (mode === "HYBRID" && (month - 1) % lumpFrequency === 0) {
      currentDeposit += lumpsumAmount;
    }

    cumulativeInvested += currentDeposit;
    runningBalance += currentDeposit;
    runningBalance *= 1 + monthlyRate;
    assertSafeValue(cumulativeInvested);
    assertSafeValue(runningBalance);

    const monthlyReturns = runningBalance - cumulativeInvested;
    assertSafeValue(monthlyReturns);
    monthlyBreakdown.push({
      month,
      year: Math.ceil(month / MONTHS_PER_YEAR),
      monthOfYear: ((month - 1) % MONTHS_PER_YEAR) + 1,
      deposit: Math.round(currentDeposit),
      investedToDate: Math.round(cumulativeInvested),
      valueToDate: Math.round(runningBalance),
      returnsToDate: Math.round(monthlyReturns),
    });

    if (month % MONTHS_PER_YEAR === 0) {
      const returnsToDate = runningBalance - cumulativeInvested;
      assertSafeValue(returnsToDate);
      yearlyBreakdown.push({
        year: month / MONTHS_PER_YEAR,
        investedToDate: Math.round(cumulativeInvested),
        valueToDate: Math.round(runningBalance),
        returnsToDate: Math.round(returnsToDate),
      });
    }
  }

  const wealthGained = runningBalance - cumulativeInvested;
  assertSafeValue(wealthGained);
  return {
    totalInvested: Math.round(cumulativeInvested),
    futureValue: Math.round(runningBalance),
    wealthGained: Math.round(wealthGained),
    yearlyBreakdown,
    monthlyBreakdown,
  };
}

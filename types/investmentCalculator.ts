export type InvestmentMode = "SIP" | "LUMPSUM" | "HYBRID";
export type LumpsumFrequency = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

export type InvestmentInputs = {
  mode: InvestmentMode;
  sipAmount: number;
  lumpsumAmount: number;
  frequency: LumpsumFrequency;
  annualReturnRate: number;
  tenureYears: number;
};

export type YearlyInvestmentRecord = {
  year: number;
  investedToDate: number;
  valueToDate: number;
  returnsToDate: number;
};

export type MonthlyInvestmentRecord = {
  month: number;
  year: number;
  monthOfYear: number;
  deposit: number;
  investedToDate: number;
  valueToDate: number;
  returnsToDate: number;
};

export type InvestmentGrowthResult = {
  totalInvested: number;
  futureValue: number;
  wealthGained: number;
  yearlyBreakdown: YearlyInvestmentRecord[];
  monthlyBreakdown: MonthlyInvestmentRecord[];
};

export type InvestmentCalculationErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_RATE"
  | "RATE_OUT_OF_RANGE"
  | "INVALID_TENURE"
  | "TENURE_OUT_OF_RANGE"
  | "OVERFLOW";

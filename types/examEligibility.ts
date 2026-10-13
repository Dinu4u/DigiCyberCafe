export type SocialCategory = "UR" | "EWS" | "OBC" | "SC" | "ST" | "PwBD";
export type PwbdBaseCategory = "UR" | "OBC" | "SC_ST";
export type Qualification = "ALL" | "10TH" | "12TH" | "GRADUATE" | "POST_GRADUATE";
export type ExamStatus = "ELIGIBLE" | "OVER_AGE" | "UNDER_AGE";

export type ExactAge = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
};

export type PanchangDetails = {
  samvatYear: number;
  sakaYear: number;
  sakaMonth: number;
  sakaDay: number;
  masaName: string;
  masaNameHindi: string;
  ritu: string;
  paksha: "Shukla" | "Krishna";
  tithiEstimate: string;
};

export type GovernmentExam = {
  id: string;
  name: string;
  organization: string;
  region: "central" | "state";
  state?: string;
  minimumAgeMonths: number;
  maximumAgeYears: number;
  minimumQualification: Exclude<Qualification, "ALL">;
  officialUrl: string;
  note?: string;
};

export type EligibilityResult = {
  exam: GovernmentExam;
  status: ExamStatus;
  relaxationYears: number;
  maximumEligibleAge: number;
  remainingYears?: number;
  remainingMonths?: number;
  overAgeYears?: number;
  overAgeMonths?: number;
  overAgeDays?: number;
  eligibleOn?: Date;
};

export type EligibilityEvaluation = {
  central: EligibilityResult[];
  state: EligibilityResult[];
  domicileSelected: boolean;
  category: SocialCategory;
  qualification: Qualification;
};

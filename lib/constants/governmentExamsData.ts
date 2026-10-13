import type {
  EligibilityEvaluation,
  EligibilityResult,
  GovernmentExam,
  PwbdBaseCategory,
  Qualification,
  SocialCategory,
} from "@/types/examEligibility";
import { addMonthsClamped, calculateExactAge } from "@/lib/utils/dateMath";

const years = (value: number) => value * 12;

export const socialCategoryRelaxation: Record<Exclude<SocialCategory, "PwBD">, number> = {
  UR: 0,
  EWS: 0,
  OBC: 3,
  SC: 5,
  ST: 5,
};

export const centralGovernmentExams: GovernmentExam[] = [
  { id: "upsc-civil-services", name: "Civil Services (IAS / IPS / IFS)", organization: "UPSC", region: "central", minimumAgeMonths: years(21), maximumAgeYears: 32, minimumQualification: "GRADUATE", officialUrl: "https://upsc.gov.in/" },
  { id: "ssc-cgl-30", name: "Combined Graduate Level — posts up to 30", organization: "SSC", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 30, minimumQualification: "GRADUATE", officialUrl: "https://ssc.gov.in/" },
  { id: "ssc-cgl-32", name: "Combined Graduate Level — posts up to 32", organization: "SSC", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 32, minimumQualification: "GRADUATE", officialUrl: "https://ssc.gov.in/" },
  { id: "ssc-chsl", name: "Combined Higher Secondary Level", organization: "SSC", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 27, minimumQualification: "12TH", officialUrl: "https://ssc.gov.in/" },
  { id: "ssc-gd", name: "Constable (GD)", organization: "SSC", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 23, minimumQualification: "10TH", officialUrl: "https://ssc.gov.in/" },
  { id: "rrb-ntpc-30", name: "RRB NTPC — posts up to 30", organization: "Railways", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 30, minimumQualification: "12TH", officialUrl: "https://www.rrbcdg.gov.in/", note: "Age limits and qualification vary by post and notification." },
  { id: "rrb-ntpc-33", name: "RRB NTPC — posts up to 33", organization: "Railways", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 33, minimumQualification: "12TH", officialUrl: "https://www.rrbcdg.gov.in/", note: "Age limits and qualification vary by post and notification." },
  { id: "rrb-group-d", name: "Group D / Level 1", organization: "Railways", region: "central", minimumAgeMonths: years(18), maximumAgeYears: 33, minimumQualification: "10TH", officialUrl: "https://www.rrbcdg.gov.in/" },
  { id: "ibps-po", name: "Probationary Officer", organization: "IBPS", region: "central", minimumAgeMonths: years(20), maximumAgeYears: 30, minimumQualification: "GRADUATE", officialUrl: "https://www.ibps.in/" },
  { id: "ibps-clerk", name: "Customer Service Associate (Clerk)", organization: "IBPS", region: "central", minimumAgeMonths: years(20), maximumAgeYears: 28, minimumQualification: "GRADUATE", officialUrl: "https://www.ibps.in/" },
  { id: "sbi-po", name: "Probationary Officer", organization: "SBI", region: "central", minimumAgeMonths: years(21), maximumAgeYears: 30, minimumQualification: "GRADUATE", officialUrl: "https://sbi.co.in/web/careers" },
  { id: "nda", name: "National Defence Academy (NDA)", organization: "UPSC", region: "central", minimumAgeMonths: 198, maximumAgeYears: 19, minimumQualification: "12TH", officialUrl: "https://upsc.gov.in/", note: "The approximate 16.5–19.5 year window depends on the notification's date-of-birth band." },
  { id: "cds", name: "Combined Defence Services (CDS)", organization: "UPSC", region: "central", minimumAgeMonths: years(19), maximumAgeYears: 24, minimumQualification: "GRADUATE", officialUrl: "https://upsc.gov.in/", note: "Age range varies by academy and course." },
  { id: "afcat-flying", name: "AFCAT — Flying Branch", organization: "Indian Air Force", region: "central", minimumAgeMonths: years(20), maximumAgeYears: 24, minimumQualification: "GRADUATE", officialUrl: "https://afcat.cdac.in/", note: "Branch-specific qualifications and age conditions apply." },
  { id: "afcat-ground", name: "AFCAT — Ground Duty", organization: "Indian Air Force", region: "central", minimumAgeMonths: years(20), maximumAgeYears: 26, minimumQualification: "GRADUATE", officialUrl: "https://afcat.cdac.in/", note: "Branch-specific qualifications and age conditions apply." },
];

export const stateGovernmentExams: GovernmentExam[] = [
  { id: "bihar-bpsc", name: "Combined Competitive Examination", organization: "BPSC", region: "state", state: "Bihar", minimumAgeMonths: years(20), maximumAgeYears: 37, minimumQualification: "GRADUATE", officialUrl: "https://bpsc.bihar.gov.in/", note: "Minimum age depends on post (commonly 20, 21 or 22); upper age may be higher for women and reserved categories." },
  { id: "bihar-constable", name: "Police Constable", organization: "CSBC", region: "state", state: "Bihar", minimumAgeMonths: years(18), maximumAgeYears: 25, minimumQualification: "12TH", officialUrl: "https://csbc.bihar.gov.in/", note: "Gender, category and recruitment-notification rules can change the age band." },
  { id: "bihar-si", name: "Police Sub-Inspector", organization: "BPSSC", region: "state", state: "Bihar", minimumAgeMonths: years(20), maximumAgeYears: 37, minimumQualification: "GRADUATE", officialUrl: "https://bpssc.bihar.gov.in/", note: "Post, gender, category and notification-specific age conditions apply." },
  { id: "up-uppsc", name: "Combined State / Upper Subordinate Services", organization: "UPPSC", region: "state", state: "Uttar Pradesh", minimumAgeMonths: years(21), maximumAgeYears: 40, minimumQualification: "GRADUATE", officialUrl: "https://uppsc.up.nic.in/" },
  { id: "up-constable", name: "Police Constable", organization: "UPPRPB", region: "state", state: "Uttar Pradesh", minimumAgeMonths: years(18), maximumAgeYears: 22, minimumQualification: "12TH", officialUrl: "https://uppbpb.gov.in/", note: "Gender-specific upper limits and notification conditions apply." },
  { id: "up-si", name: "Police Sub-Inspector", organization: "UPPRPB", region: "state", state: "Uttar Pradesh", minimumAgeMonths: years(21), maximumAgeYears: 28, minimumQualification: "GRADUATE", officialUrl: "https://uppbpb.gov.in/" },
  { id: "rajasthan-ras", name: "RAS / RTS Combined Competitive Examination", organization: "RPSC", region: "state", state: "Rajasthan", minimumAgeMonths: years(21), maximumAgeYears: 40, minimumQualification: "GRADUATE", officialUrl: "https://rpsc.rajasthan.gov.in/" },
  { id: "rajasthan-constable", name: "Police Constable", organization: "Rajasthan Police", region: "state", state: "Rajasthan", minimumAgeMonths: years(18), maximumAgeYears: 24, minimumQualification: "12TH", officialUrl: "https://police.rajasthan.gov.in/", note: "Post and category-specific age conditions may apply." },
  { id: "mp-state-service", name: "State Service Examination", organization: "MPPSC", region: "state", state: "Madhya Pradesh", minimumAgeMonths: years(21), maximumAgeYears: 40, minimumQualification: "GRADUATE", officialUrl: "https://mppsc.mp.gov.in/", note: "Uniformed posts may have a lower upper-age limit (commonly 33); category and domicile rules vary." },
  { id: "maharashtra-mpsc", name: "Rajyaseva / State Services", organization: "MPSC", region: "state", state: "Maharashtra", minimumAgeMonths: years(19), maximumAgeYears: 38, minimumQualification: "GRADUATE", officialUrl: "https://mpsc.gov.in/", note: "Open-category baseline; post and notification-specific rules apply." },
  { id: "delhi-dsssb-27", name: "DSSSB — posts with upper age 27", organization: "DSSSB", region: "state", state: "Delhi", minimumAgeMonths: years(18), maximumAgeYears: 27, minimumQualification: "12TH", officialUrl: "https://dsssb.delhi.gov.in/", note: "DSSSB age bands vary by post (commonly 18–27, 18–30 or 18–32)." },
  { id: "delhi-dsssb-30", name: "DSSSB — posts with upper age 30", organization: "DSSSB", region: "state", state: "Delhi", minimumAgeMonths: years(18), maximumAgeYears: 30, minimumQualification: "12TH", officialUrl: "https://dsssb.delhi.gov.in/", note: "DSSSB age bands vary by post and notification." },
  { id: "delhi-dsssb-32", name: "DSSSB — posts with upper age 32", organization: "DSSSB", region: "state", state: "Delhi", minimumAgeMonths: years(18), maximumAgeYears: 32, minimumQualification: "12TH", officialUrl: "https://dsssb.delhi.gov.in/", note: "DSSSB age bands vary by post and notification." },
];

const qualificationRank: Record<Qualification, number> = {
  ALL: Number.POSITIVE_INFINITY,
  "10TH": 1,
  "12TH": 2,
  GRADUATE: 3,
  POST_GRADUATE: 4,
};

function categoryRelaxation(category: SocialCategory, pwbdBaseCategory: PwbdBaseCategory): number {
  if (category !== "PwBD") return socialCategoryRelaxation[category];
  if (pwbdBaseCategory === "OBC") return 13;
  if (pwbdBaseCategory === "SC_ST") return 15;
  return 10;
}

function evaluateExam(
  exam: GovernmentExam,
  age: { years: number; months: number },
  dateOfBirth: Date,
  cutoffDate: Date,
  relaxationYears: number,
): EligibilityResult {
  const maximumEligibleAge = exam.maximumAgeYears + relaxationYears;
  const minimumAgeYears = Math.floor(exam.minimumAgeMonths / 12);
  const minimumAgeRemainderMonths = exam.minimumAgeMonths % 12;
  const belowMinimum =
    age.years < minimumAgeYears ||
    (age.years === minimumAgeYears && age.months < minimumAgeRemainderMonths);

  if (belowMinimum) {
    const remainingMonths =
      exam.minimumAgeMonths - (age.years * 12 + age.months);
    return {
      exam,
      status: "UNDER_AGE",
      relaxationYears,
      maximumEligibleAge,
      eligibleOn: addMonthsClamped(dateOfBirth, exam.minimumAgeMonths),
      remainingYears: Math.floor(remainingMonths / 12),
      remainingMonths: remainingMonths % 12,
    };
  }

  if (age.years > maximumEligibleAge) {
    const maximumAgeBoundary = addMonthsClamped(
      dateOfBirth,
      (maximumEligibleAge + 1) * 12,
    );
    const overage = calculateExactAge(maximumAgeBoundary, cutoffDate);
    return {
      exam,
      status: "OVER_AGE",
      relaxationYears,
      maximumEligibleAge,
      overAgeYears: overage.years,
      overAgeMonths: overage.months,
      overAgeDays: overage.days,
    };
  }

  const remainingMonths = (maximumEligibleAge - age.years) * 12 + 11 - age.months;
  return {
    exam,
    status: "ELIGIBLE",
    relaxationYears,
    maximumEligibleAge,
    remainingYears: Math.floor(remainingMonths / 12),
    remainingMonths: remainingMonths % 12,
  };
}

export function evaluateEligibility(
  userAge: { years: number; months: number },
  category: SocialCategory | null | undefined = "UR",
  domicileState: string | null | undefined = null,
  qualification: Qualification = "ALL",
  dateOfBirth?: Date,
  cutoffDate?: Date,
  pwbdBaseCategory: PwbdBaseCategory = "UR",
): EligibilityEvaluation {
  if (
    !Number.isSafeInteger(userAge.years) ||
    !Number.isSafeInteger(userAge.months) ||
    userAge.years < 0 ||
    userAge.months < 0 ||
    userAge.months > 11
  ) {
    throw new RangeError("Age must contain non-negative whole years and months.");
  }
  if (!dateOfBirth || !cutoffDate) {
    throw new RangeError("Date of birth and cutoff date are required for eligibility matching.");
  }

  const selectedCategory = category ?? "UR";
  const relaxationYears = categoryRelaxation(selectedCategory, pwbdBaseCategory);
  const qualificationLimit = qualificationRank[qualification];
  const matchesQualification = (exam: GovernmentExam) =>
    qualificationRank[exam.minimumQualification] <= qualificationLimit;

  const central = centralGovernmentExams
    .filter(matchesQualification)
    .map((exam) => evaluateExam(exam, userAge, dateOfBirth, cutoffDate, relaxationYears));

  const state = stateGovernmentExams
    .filter(matchesQualification)
    .filter((exam) => !domicileState || exam.state === domicileState)
    .map((exam) => evaluateExam(exam, userAge, dateOfBirth, cutoffDate, relaxationYears));

  return {
    central,
    state,
    domicileSelected: Boolean(domicileState),
    category: selectedCategory,
    qualification,
  };
}

export const examStates = [
  "Bihar",
  "Uttar Pradesh",
  "Rajasthan",
  "Madhya Pradesh",
  "Maharashtra",
  "Delhi",
] as const;

export type EmailCategory = "Out of Office" | "Formal Leave Application" | "Resignation Letter" | "Appraisal Discussion";

export type EmailField =
  | "name"
  | "role"
  | "managerName"
  | "startDate"
  | "endDate"
  | "reason"
  | "backupName"
  | "backupEmail"
  | "backupPhone"
  | "projectName"
  | "noticeDays";

export type CorporateEmailValues = Record<EmailField, string>;

export type EmailTemplate = {
  id: string;
  name: string;
  category: EmailCategory;
  description: string;
  fields: EmailField[];
  subject: (values: CorporateEmailValues) => string;
  body: (values: CorporateEmailValues) => string;
};

function displayName(values: CorporateEmailValues) {
  return values.name.trim() || "[Your Name]";
}

function dateText(value: string) {
  if (!value) return "[date]";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? "[date]" : new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date);
}

function dateRange(values: CorporateEmailValues) {
  return `${dateText(values.startDate)} to ${dateText(values.endDate)}`;
}

function managerGreeting(values: CorporateEmailValues) {
  return values.managerName.trim() ? `Dear ${values.managerName.trim()},` : "Dear Manager,";
}

function signoff(values: CorporateEmailValues) {
  return `Regards,\n${displayName(values)}${values.role.trim() ? `\n${values.role.trim()}` : ""}`;
}

function backupDetails(values: CorporateEmailValues) {
  const name = values.backupName.trim();
  const email = values.backupEmail.trim();
  const phone = values.backupPhone.trim();
  if (!name && !email && !phone) return "";
  const contact = [email, phone].filter(Boolean).join(" / ");
  return `During my absence, ${name || "my colleague"}${contact ? ` (${contact})` : ""} will be the point of contact for urgent matters.`;
}

function handoverDetails(values: CorporateEmailValues) {
  const name = values.backupName.trim();
  const contact = [values.backupEmail.trim(), values.backupPhone.trim()].filter(Boolean).join(" / ");
  if (!name && !contact) return "I will document my responsibilities and hand over active work before my final day.";
  return `I will prepare a handover for ${name || "the designated colleague"}${contact ? ` (${contact})` : ""} and share the status of active work before my final day.`;
}

function reasonSentence(values: CorporateEmailValues) {
  return values.reason.trim() ? ` The reason for my request is ${values.reason.trim()}.` : "";
}

const leaveFields: EmailField[] = ["name", "role", "managerName", "startDate", "endDate", "reason", "backupName", "backupEmail", "backupPhone"];
const outOfOfficeFields: EmailField[] = ["name", "role", "startDate", "endDate", "backupName", "backupEmail", "backupPhone"];

export const emailTemplateCategories: EmailCategory[] = [
  "Out of Office",
  "Formal Leave Application",
  "Resignation Letter",
  "Appraisal Discussion",
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: "ooo-formal",
    name: "Out of office · Formal",
    category: "Out of Office",
    description: "A polished automatic-reply message for clients and colleagues.",
    fields: outOfOfficeFields,
    subject: () => "Out of Office",
    body: (values) => `Hello,\n\nThank you for your message. I am out of the office from ${dateRange(values)} and will respond when I return.\n\n${backupDetails(values)}\n\n${signoff(values)}`.replace(/\n\n\n+/g, "\n\n"),
  },
  {
    id: "ooo-client",
    name: "Out of office · Client-facing",
    category: "Out of Office",
    description: "Sets expectations clearly while giving clients a useful contact.",
    fields: outOfOfficeFields,
    subject: () => "Thank you for your email",
    body: (values) => `Hello,\n\nThank you for reaching out. I am away from ${dateRange(values)} and may not be able to respond during this time.\n\n${backupDetails(values) || "I will reply as soon as possible after I return."}\n\nThank you for your understanding.\n\n${signoff(values)}`,
  },
  {
    id: "ooo-team",
    name: "Out of office · Internal team",
    category: "Out of Office",
    description: "A concise handoff note for teammates.",
    fields: [...outOfOfficeFields, "projectName"],
    subject: (values) => `Away ${values.projectName.trim() ? `from ${values.projectName.trim()}` : "from work"}`,
    body: (values) => `Hi team,\n\nI will be away from ${dateRange(values)}.${values.projectName.trim() ? ` For ${values.projectName.trim()},` : ""} please coordinate with the contact below for anything that cannot wait.\n\n${backupDetails(values) || "I will catch up on messages when I return."}\n\n${signoff(values)}`,
  },
  {
    id: "ooo-urgent",
    name: "Out of office · Urgent escalations",
    category: "Out of Office",
    description: "Prioritizes urgent requests and includes an escalation contact when supplied.",
    fields: outOfOfficeFields,
    subject: () => "Out of Office · Urgent matters",
    body: (values) => `Hello,\n\nI am unavailable from ${dateRange(values)}. For urgent matters that need attention before I return, please contact the colleague below.\n\n${backupDetails(values) || "If no alternate contact is listed, please contact your team lead for urgent support."}\n\nI will respond to other messages after I return.\n\n${signoff(values)}`,
  },
  {
    id: "leave-sick",
    name: "Sick leave",
    category: "Formal Leave Application",
    description: "A considerate, concise sick leave request.",
    fields: leaveFields,
    subject: (values) => `Sick leave request · ${dateRange(values)}`,
    body: (values) => `${managerGreeting(values)}\n\nI am unwell and would like to request sick leave from ${dateRange(values)}.${reasonSentence(values)}\n\n${backupDetails(values)}\n\nPlease let me know if you need any handover details.\n\n${signoff(values)}`.replace(/\n\n\n+/g, "\n\n"),
  },
  {
    id: "leave-planned",
    name: "Planned leave",
    category: "Formal Leave Application",
    description: "A formal request for planned time away.",
    fields: leaveFields,
    subject: (values) => `Planned leave request · ${dateRange(values)}`,
    body: (values) => `${managerGreeting(values)}\n\nI would like to request leave from ${dateRange(values)}.${reasonSentence(values)}\n\nI will prepare a handover before my leave begins. ${backupDetails(values)}\n\nPlease let me know if these dates can be approved.\n\n${signoff(values)}`.replace(/\n\n\n+/g, "\n\n"),
  },
  {
    id: "leave-bereavement",
    name: "Bereavement leave",
    category: "Formal Leave Application",
    description: "A brief and respectful bereavement leave request.",
    fields: leaveFields,
    subject: (values) => `Bereavement leave request · ${dateRange(values)}`,
    body: (values) => `${managerGreeting(values)}\n\nI am writing to request bereavement leave from ${dateRange(values)}. I need time to be with my family during a difficult period.${values.reason.trim() ? ` ${values.reason.trim()}` : ""}\n\n${backupDetails(values)}\n\nThank you for your understanding.\n\n${signoff(values)}`.replace(/\n\n\n+/g, "\n\n"),
  },
  ...([30, 60, 90] as const).map((days) => ({
    id: `resignation-${days}`,
    name: `Resignation · ${days}-day notice`,
    category: "Resignation Letter" as const,
    description: `A professional resignation with a ${days}-day notice period and handover plan.`,
    fields: ["name", "role", "managerName", "startDate", "noticeDays", "reason", "projectName", "backupName", "backupEmail", "backupPhone"] as EmailField[],
    subject: (values: CorporateEmailValues) => `Resignation notice · ${values.role.trim() || "Position"}`,
    body: (values: CorporateEmailValues) => `${managerGreeting(values)}\n\nPlease accept this email as formal notice of my resignation from my role as ${values.role.trim() || "[Role]"}. My final working day will be ${dateText(values.endDate)} after a ${values.noticeDays.trim() || String(days)}-day notice period.${values.reason.trim() ? ` I have made this decision because ${values.reason.trim()}.` : ""}\n\nI am committed to supporting a smooth transition${values.projectName.trim() ? ` for ${values.projectName.trim()}` : ""}. ${handoverDetails(values)}\n\nThank you for the opportunities and support during my time here.\n\n${signoff(values)}`.replace(/\n\n\n+/g, "\n\n"),
  })),
  {
    id: "appraisal-request",
    name: "Appraisal discussion request",
    category: "Appraisal Discussion",
    description: "Requests a focused conversation about contributions and growth.",
    fields: ["name", "role", "managerName", "projectName", "reason"],
    subject: (values) => `Request for an appraisal discussion${values.projectName.trim() ? ` · ${values.projectName.trim()}` : ""}`,
    body: (values) => `${managerGreeting(values)}\n\nI would appreciate the opportunity to discuss my performance, contributions, and growth in my role as ${values.role.trim() || "[Role]"}.${values.projectName.trim() ? ` Recent work I would like to review includes ${values.projectName.trim()}.` : ""}${values.reason.trim() ? ` ${values.reason.trim()}` : ""}\n\nWould you be available to schedule a conversation at a convenient time?\n\n${signoff(values)}`,
  },
];

export const emailFieldLabels: Record<EmailField, string> = {
  name: "Your name",
  role: "Role / position",
  managerName: "Manager name",
  startDate: "Start date",
  endDate: "End date / last working day",
  reason: "Reason or context",
  backupName: "Backup colleague name",
  backupEmail: "Backup email",
  backupPhone: "Backup phone",
  projectName: "Project / handover focus",
  noticeDays: "Notice period (days)",
};

"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Moon, RotateCcw, Sun } from "lucide-react";
import {
  emailFieldLabels,
  emailTemplateCategories,
  emailTemplates,
  type CorporateEmailValues,
  type EmailField,
  type EmailTemplate,
} from "@/lib/constants/emailTemplates";
import styles from "./CorporateEmailGenerator.module.css";

type Theme = "light" | "dark";
type RecoveryInfo = { title: string; message: string; steps: string[] };

const emptyValues: CorporateEmailValues = {
  name: "",
  role: "",
  managerName: "",
  startDate: "",
  endDate: "",
  reason: "",
  backupName: "",
  backupEmail: "",
  backupPhone: "",
  projectName: "",
  noticeDays: "30",
};

export function CorporateEmailGenerator() {
  const [templateId, setTemplateId] = useState("ooo-formal");
  const [values, setValues] = useState<CorporateEmailValues>(emptyValues);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [recovery, setRecovery] = useState<RecoveryInfo | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  const template = emailTemplates.find((item) => item.id === templateId) ?? emailTemplates[0];
  const subject = template.subject(values);
  const body = template.body(values);
  const rangeError = values.startDate && values.endDate && values.endDate < values.startDate
    ? "End date cannot be earlier than start date."
    : "";
  const recipientError = recipientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())
    ? "Enter a valid recipient email address or leave it blank."
    : "";
  const formError = rangeError || recipientError;
  const mailtoHref = `mailto:${recipientEmail.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function updateField(field: EmailField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setRecovery(null);
    setCopied(null);
  }

  function selectTemplate(nextId: string) {
    const next = emailTemplates.find((item) => item.id === nextId);
    if (!next) return;
    setTemplateId(nextId);
    if (next.id.startsWith("resignation-")) {
      const days = next.id.split("-")[1];
      setValues((current) => ({ ...current, noticeDays: days }));
    }
    setRecovery(null);
    setCopied(null);
  }

  async function copyText(kind: "subject" | "body", text: string) {
    if (formError) return setRecovery(validationRecovery(formError));
  if (!text.trim()) return setRecovery({ title: "Nothing to copy", message: "This template did not produce any text.", steps: ["Choose a template again.", "Check the fields that appear in the form.", "Retry the copy action."] });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser context.");
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setRecovery(null);
      window.setTimeout(() => setCopied((current) => current === kind ? null : current), 1800);
    } catch (error) {
      setRecovery({
        title: "Could not copy to clipboard",
        message: error instanceof Error ? error.message : "Clipboard access was denied.",
        steps: ["Allow clipboard access for this page, or open the app in a secure browser tab.", `Select the ${kind === "subject" ? "subject line" : "email body"} in the preview and copy it manually.`, "Try the copy button again."],
      });
    }
  }

  function openMailClient() {
    if (formError) return setRecovery(validationRecovery(formError));
    if (subject.length + body.length > 12000) {
      setRecovery({
        title: "Email link is too long",
        message: "The generated message exceeds the practical size supported by many mail clients.",
        steps: ["Shorten the reason or handover notes.", "Copy the subject and body separately instead.", "Retry opening the mail client."],
      });
      return;
    }
    try {
      window.location.assign(mailtoHref);
      setRecovery(null);
    } catch (error) {
      setRecovery({
        title: "Could not open a mail client",
        message: error instanceof Error ? error.message : "This browser did not accept the email link.",
        steps: ["Make sure a mail application is configured on this device.", "Copy the subject and body using the buttons above.", "Paste them into a new email manually."],
      });
    }
  }

  function resetFields() {
    setValues(emptyValues);
    setRecipientEmail("");
    setRecovery(null);
    setCopied(null);
  }

  return <section className={`${styles.generator} ${theme === "dark" ? styles.dark : ""} grid min-h-[calc(100vh-72px)] gap-6 px-4 py-8 sm:px-6 lg:px-10`} data-theme={theme}>
    <header className={`${styles.heading} flex flex-wrap items-end justify-between gap-5`}>
      <div><p className="eyebrow">CORPORATE EMAIL FORMAT</p><h1>Corporate Email Format</h1><p>Create a clear, professional message from a ready-to-edit template.</p></div>
      <button className={styles.themeButton} onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}{theme === "light" ? "Dark mode" : "Light mode"}</button>
    </header>

    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(290px,360px)_minmax(0,1fr)]">
      <section className={`${styles.formPanel} min-w-0`} aria-label="Email template and fields">
        <div className={styles.panelTitle}><div><p className={styles.step}>01 / DETAILS</p><h2>Build your email</h2></div><button className={styles.iconButton} onClick={resetFields} aria-label="Reset fields" title="Reset fields"><RotateCcw size={16} /></button></div>
        <label className={styles.field}>Template<select value={templateId} onChange={(event) => selectTemplate(event.target.value)}>{emailTemplateCategories.map((category) => <optgroup label={category} key={category}>{emailTemplates.filter((item) => item.category === category).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</optgroup>)}</select><small>{template.description}</small></label>
        <label className={styles.field}>Send to (optional)<input type="email" value={recipientEmail} onChange={(event) => { setRecipientEmail(event.target.value); setRecovery(null); }} placeholder="name@company.com" aria-invalid={Boolean(recipientError)} /></label>
        <div className={styles.dynamicFields}>{template.fields.map((field) => <EmailInput key={`${template.id}-${field}`} field={field} template={template} values={values} onChange={updateField} />)}</div>
        {formError && <p className={styles.inlineError} role="alert">{formError}</p>}
      </section>

      <section className={`${styles.previewPanel} min-w-0`} aria-label="Live email preview">
        <div className={styles.panelTitle}><div><p className={styles.step}>02 / PREVIEW</p><h2>Ready to send</h2></div><span className={styles.liveStatus}><span /> Live preview</span></div>
        <div className={styles.previewBlock}>
          <div className={styles.previewLabelRow}><label htmlFor="email-subject">Subject line</label><button className={styles.copyButton} onClick={() => void copyText("subject", subject)} disabled={Boolean(formError)}><Copy size={15} />{copied === "subject" ? "Copied" : "Copy subject"}</button></div>
          <div id="email-subject" className={styles.subjectText}>{subject}</div>
        </div>
        <div className={`${styles.previewBlock} ${styles.bodyBlock}`}>
          <div className={styles.previewLabelRow}><label htmlFor="email-body">Email body</label><button className={styles.copyButton} onClick={() => void copyText("body", body)} disabled={Boolean(formError)}><Copy size={15} />{copied === "body" ? "Copied" : "Copy body"}</button></div>
          <pre id="email-body" className={styles.bodyText}>{body}</pre>
        </div>
        <div className={styles.mailActions}><button className={styles.mailButton} onClick={openMailClient} disabled={Boolean(formError)}><ArrowUpRight size={16} /> Open in Mail Client</button><span><Check size={14} /> No AI or server calls</span></div>
        <ErrorRecoveryPanel recovery={recovery} onDismiss={() => setRecovery(null)} />
        <div className={styles.recoveryClause}><h3>Error Handling &amp; Recovery</h3><p>Input, clipboard, and mail-client failures are caught with a clear explanation and step-by-step recovery guidance.</p></div>
      </section>
    </div>
  </section>;
}

function EmailInput({ field, template, values, onChange }: { field: EmailField; template: EmailTemplate; values: CorporateEmailValues; onChange: (field: EmailField, value: string) => void }) {
  const label = field === "startDate" && template.id.startsWith("resignation-") ? "Notice date" : emailFieldLabels[field];
  const isDate = field === "startDate" || field === "endDate";
  const isTextArea = field === "reason" || field === "projectName";
  if (isTextArea) return <label className={styles.field}>{label}<textarea rows={field === "reason" ? 3 : 2} value={values[field]} onChange={(event) => onChange(field, event.target.value)} placeholder={field === "reason" ? "Add a short explanation (optional)" : "Add context for the handover (optional)"} /></label>;
  return <label className={styles.field}>{label}<input type={isDate ? "date" : field === "backupEmail" ? "email" : field === "backupPhone" ? "tel" : field === "noticeDays" ? "number" : "text"} min={isDate && field === "endDate" ? values.startDate || undefined : field === "noticeDays" ? "1" : undefined} value={values[field]} onChange={(event) => onChange(field, event.target.value)} placeholder={field === "noticeDays" ? "30" : field === "backupEmail" ? "colleague@company.com" : undefined} /></label>;
}

function ErrorRecoveryPanel({ recovery, onDismiss }: { recovery: RecoveryInfo | null; onDismiss: () => void }) {
  if (!recovery) return null;
  return <section className={styles.errorPanel} role="alert"><div className={styles.errorTop}><div><h3>{recovery.title}</h3><p>{recovery.message}</p></div><button className={styles.iconButton} onClick={onDismiss} aria-label="Dismiss error">×</button></div><h4>What to do next</h4><ol>{recovery.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>;
}

function validationRecovery(message: string): RecoveryInfo {
  return { title: "Check the email details", message, steps: ["Correct the date range or recipient address highlighted in the form.", "Review the subject and body preview.", "Retry copying or opening the mail client."] };
}

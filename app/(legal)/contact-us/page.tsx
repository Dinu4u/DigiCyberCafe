"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { BackToHome } from "@/components/navigation/BackToHome";
import { AD_CONFIG } from "@/config/adPolicy";

export default function ContactUsPage() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const replyTo = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const details = String(formData.get("message") ?? "").trim();
    const body = [`Name: ${name}`, `Reply-to: ${replyTo}`, "", details].join("\n");

    window.location.href = `mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}?${new URLSearchParams({
      subject: subject || "DigiCyberCafe enquiry",
      body,
    }).toString()}`;
    setMessage("Your email app should open with your message ready to send.");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <BackToHome />
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">Contact</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Get in touch</h1>
      <p className="mt-4 leading-7 text-slate-600">
        Questions, accessibility feedback, corrections, or tool issues are welcome.
        Contact Dinesh Kumar, the operator of DigiCyberCafe, in Patna, Bihar, India.
      </p>
      <p className="mt-3 leading-7 text-slate-600">
        Email{" "}
        <a className="font-medium text-emerald-800 underline" href={`mailto:${AD_CONFIG.PUBLISHER_INFO.EMAIL}`}>
          {AD_CONFIG.PUBLISHER_INFO.EMAIL}
        </a>
        . We do not operate a server-side contact form: submitting below opens your
        device&apos;s default email application, and nothing is sent until you choose
        to send it.
      </p>

      <form className="mt-8 grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Your name
          <input autoComplete="name" className="rounded-md border border-slate-300 px-3 py-2.5 font-normal" maxLength={100} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Your email
          <input autoComplete="email" className="rounded-md border border-slate-300 px-3 py-2.5 font-normal" maxLength={254} name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Subject
          <input className="rounded-md border border-slate-300 px-3 py-2.5 font-normal" maxLength={150} name="subject" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Message
          <textarea className="min-h-36 rounded-md border border-slate-300 px-3 py-2.5 font-normal" maxLength={5000} name="message" required />
        </label>
        <button className="w-fit rounded-md bg-emerald-800 px-5 py-3 font-medium text-white hover:bg-emerald-900" type="submit">
          Continue to email
        </button>
        <p aria-live="polite" className="text-sm text-slate-600">{message}</p>
      </form>
      <address className="mt-7 text-sm not-italic leading-6 text-slate-500">
        Dinesh Kumar · DigiCyberCafe
        <br />
        Patna, Bihar — 800024, India
      </address>
    </main>
  );
}

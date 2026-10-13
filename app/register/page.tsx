"use client";
import { BrandHomeLink } from "@/components/navigation/BrandHomeLink";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) }); if (!response.ok) { const body = await response.json(); setError(body.error ?? "Could not create your account."); setBusy(false); return; } await signIn("credentials", { email, password, callbackUrl: "/dashboard" }); }
  return <main className="auth-shell"><Link className="auth-back" href="/"><ArrowLeft size={16} /> Back to workspace</Link><section className="auth-card"><BrandHomeLink className="auth-mark">D</BrandHomeLink><p className="eyebrow">START SIMPLY</p><h1>Make room for good work.</h1><p className="auth-subtitle">Create your free <BrandHomeLink className="auth-brand">DigiCyberCafe</BrandHomeLink> account.</p><button className="google-button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}><Globe2 size={17} /> Sign up with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button></form><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section></main>;
}
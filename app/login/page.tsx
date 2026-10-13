"use client";
import { BrandHomeLink } from "@/components/navigation/BrandHomeLink";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Globe2, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); const result = await signIn("credentials", { email, password, callbackUrl: "/dashboard", redirect: false }); if (result?.error) setError("That email or password is not correct."); else window.location.href = result?.url ?? "/dashboard"; setBusy(false); }
  return <main className="auth-shell"><Link className="auth-back" href="/"><ArrowLeft size={16} /> Back to workspace</Link><section className="auth-card"><BrandHomeLink className="auth-mark">e</BrandHomeLink><p className="eyebrow">WELCOME BACK</p><h1>Sign in to <BrandHomeLink className="auth-brand">eCyberCafe</BrandHomeLink>.</h1><p className="auth-subtitle">Your documents, ready when you are.</p><button className="google-button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}><Globe2 size={17} /> Continue with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form><p className="auth-switch">New here? <Link href="/register">Create a free account</Link></p><p className="auth-note"><LockKeyhole size={13} /> Your documents stay yours.</p></section></main>;
}
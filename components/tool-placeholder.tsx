"use client";
import { ArrowLeft, FileText, Link2, Upload } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function ToolPlaceholder({ title, description }: { title: string; description: string }) {
  const [url, setUrl] = useState("");
  return <main className="tool-shell"><header className="builder-topbar"><Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link></header><section className="tool-center"><div className="tool-large-icon"><FileText size={25} /></div><p className="eyebrow">PRIVATE, IN-BROWSER TOOL</p><h1>{title}</h1><p>{description}</p>{title === "Media downloader" ? <div className="url-input"><Link2 size={18} /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a public URL here" /><button className="primary-button">Fetch media</button></div> : <label className="dropzone"><Upload size={24} /><strong>Drop files here, or browse</strong><span>Your files stay on this device</span><input type="file" multiple /></label>}<Link href="/#tools" className="back-home">Return to all tools</Link></section></main>;
}

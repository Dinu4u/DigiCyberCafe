import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

const allowedHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be", "instagram.com", "www.instagram.com", "facebook.com", "www.facebook.com", "x.com", "www.x.com", "twitter.com", "www.twitter.com"]);
const requests = new Map<string, number[]>();

function checkYtDlp() {
  return new Promise<boolean>((resolve) => {
    const probe = spawn("yt-dlp", ["--version"], { stdio: ["ignore", "ignore", "ignore"] });
    probe.once("error", () => resolve(false));
    probe.once("close", (code) => resolve(code === 0));
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now(); const recent = (requests.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  const { url, format = "mp4-720p" } = await request.json();
  let parsed: URL;
  try { parsed = new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  if (!allowedHosts.has(parsed.hostname)) return NextResponse.json({ error: "Unsupported source" }, { status: 400 });
  if (!(await checkYtDlp())) return NextResponse.json({ error: "The downloader server is not ready. Install yt-dlp and FFmpeg, then restart the app." }, { status: 503 });
  requests.set(ip, [...recent, now]);
  const selector = format === "mp3" ? "bestaudio/best" : format === "mp4-high" ? "bestvideo*+bestaudio/best" : "best[height<=720]/best";
  const args = format === "mp3" ? ["--no-playlist", "-f", selector, "--extract-audio", "--audio-format", "mp3", "--audio-quality", "0", "-o", "-", parsed.toString()] : ["--no-playlist", "-f", selector, "--merge-output-format", "mp4", "-o", "-", parsed.toString()];
  const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
  let errorOutput = "";
  child.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
  const stream = new ReadableStream({ start(controller) { child.stdout.on("data", (chunk) => controller.enqueue(chunk)); child.stdout.on("end", () => { if (child.exitCode && child.exitCode !== 0) controller.error(new Error(errorOutput || "yt-dlp failed")); else controller.close(); }); child.on("error", () => controller.error(new Error("yt-dlp is not installed or is unavailable on the server."))); }, cancel() { child.kill(); } });
  return new Response(stream, { headers: { "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4", "Content-Disposition": `attachment; filename="DigiCyberCafe-download.${format === "mp3" ? "mp3" : "mp4"}"`, "Transfer-Encoding": "chunked", "Cache-Control": "no-store" } });
}

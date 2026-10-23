import { ArrowDown, ArrowUpRight, CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./DownloaderFaq.module.css";

const questions = [
  {
    question: "How do I copy a link on mobile or desktop?",
    answer:
      "Open the public post, video, reel, or track. On mobile, tap Share and choose Copy link. On desktop, copy the page address from your browser. Then paste the link into the downloader above.",
  },
  {
    question: "Which platforms and formats are supported?",
    answer:
      "Public links from YouTube, Instagram, Facebook, X/Twitter, TikTok, and SoundCloud are supported. Available downloads depend on the source and may include MP4 or WebM video and MP3 or M4A audio.",
  },
  {
    question: "How do I choose video quality?",
    answer:
      "Higher resolutions such as 1440p or 4K preserve more detail and generally use more data and storage. Choose 720p or 480p for a smaller file when that quality is available for the media.",
  },
  {
    question: "Why don't I see every quality or format?",
    answer:
      "The list reflects streams the platform makes available for that public link. Some posts offer only one resolution, audio, or a different format; unavailable options cannot be created by the downloader.",
  },
  {
    question: "Can I download private or age-restricted content?",
    answer:
      "No. The downloader does not sign into accounts or bypass privacy, age, regional, or other platform restrictions. The media must be public and accessible without authentication.",
  },
  {
    question: "Are my links or download history saved?",
    answer:
      "No personal media or search history is saved by this tool. Your browser requests the public link to retrieve its available media, so the source platform still receives the request.",
  },
];

export function DownloaderFaq() {
  return (
    <section className={styles.section} aria-labelledby="downloader-faq-heading">
      <div className={styles.layout}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>
            <CircleHelp size={14} /> QUICK HELP
          </span>
          <h2 id="downloader-faq-heading">
            Good questions.<br />
            <em>Clear answers.</em>
          </h2>
          <p>
            A few details to help you get the right download, safely and
            without guesswork.
          </p>
          <div className={styles.trustNote}>
            <ShieldCheck size={17} />
            <span>
              <strong>Public links only</strong>
              No sign-in or privacy bypass
            </span>
          </div>
          <a className={styles.backToTool} href="#downloader-search">
            Back to downloader <ArrowUpRight size={15} />
          </a>
          <Sparkles className={styles.sparkle} size={76} strokeWidth={0.8} />
        </div>

        <div className={styles.questions} aria-label="Downloader questions">
          {questions.map((item, index) => (
            <details className={styles.item} key={item.question} open={index === 0}>
              <summary>
                <span className={styles.number}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.question}>{item.question}</span>
                <span className={styles.chevron} aria-hidden="true">
                  <ArrowDown size={16} />
                </span>
              </summary>
              <div className={styles.answer}>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
          <p className={styles.keyboardHint}>
            <span aria-hidden="true">↵</span> Select a question to show its answer
          </p>
        </div>
      </div>
    </section>
  );
}

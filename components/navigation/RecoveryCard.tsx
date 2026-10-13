import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import styles from "./RecoveryCard.module.css";

interface RecoveryCardProps {
  onRetry?: () => void;
}

export function RecoveryCard({ onRetry }: RecoveryCardProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><CircleAlert size={22} /></span>
        <p className={styles.eyebrow}>PAGE NOT AVAILABLE</p>
        <h1>We couldn&apos;t load this tool or page.</h1>
        <p className={styles.message}>
          The page may have moved, or something went wrong while it was
          opening. Return to DigiCyberCafe Home to continue.
        </p>
        <div className={styles.actions}>
          {onRetry && (
            <button className={styles.secondary} onClick={onRetry} type="button">
              Try again
            </button>
          )}
          <Link className={styles.primary} href="/">
            <ArrowLeft size={16} /> Return to DigiCyberCafe Home
          </Link>
        </div>
      </section>
    </main>
  );
}

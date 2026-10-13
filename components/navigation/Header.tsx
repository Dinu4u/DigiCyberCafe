import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { HeaderActions } from "./HeaderActions";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          aria-label="eCyberCafe Home"
          className={styles.brand}
          href="/"
          title="Go to eCyberCafe Home"
        >
          <span aria-hidden="true" className={styles.brandMark}>e</span>
          <span className={styles.brandName}>eCyberCafe</span>
          <span className={styles.brandBadge}>Privacy-first tools</span>
        </Link>

        <div className={styles.trust}>
          <ShieldCheck aria-hidden="true" size={16} />
          <span>Local Processing Where Supported <i>·</i> Privacy-First Tools</span>
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}

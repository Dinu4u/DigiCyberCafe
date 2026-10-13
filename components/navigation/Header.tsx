import Link from "next/link";
import { HeaderActions } from "./HeaderActions";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          aria-label="DigiCyberCafe Home"
          className={styles.brand}
          href="/"
          title="Go to DigiCyberCafe Home"
        >
          <span aria-hidden="true" className={styles.brandMark}>D</span>
          <span className={styles.brandName}>DigiCyberCafe</span>
          <span className={styles.brandBadge}>Privacy-first tools</span>
        </Link>

        <HeaderActions />
      </div>
    </header>
  );
}

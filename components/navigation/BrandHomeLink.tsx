import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./BrandHomeLink.module.css";

interface BrandHomeLinkProps {
  children: ReactNode;
  className: string;
}

export function BrandHomeLink({ children, className }: BrandHomeLinkProps) {
  return (
    <Link
      aria-label="eCyberCafe Home"
      className={`${className} ${styles.link}`}
      href="/"
      title="Go to eCyberCafe Home"
    >
      {children}
    </Link>
  );
}

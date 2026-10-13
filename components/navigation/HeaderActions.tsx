"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Globe2, Menu, Search } from "lucide-react";

export function HeaderActions() {
  const [language, setLanguage] = useState<"en" | "hi">(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("eCyberCafe-language") === "hi" ? "hi" : "en";
  });
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageSwitcherRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!languageMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!languageSwitcherRef.current?.contains(event.target as Node)) setLanguageMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageMenuOpen]);

  const openSearch = () => {
    if (pathname !== "/") {
      router.push("/?search=1");
      return;
    }
    window.dispatchEvent(new Event("ecybercafe:open-search"));
  };

  const changeLanguage = (next: "en" | "hi") => {
    setLanguage(next);
    window.localStorage.setItem("eCyberCafe-language", next);
    window.dispatchEvent(new CustomEvent("ecybercafe:language-change", { detail: next }));
    setLanguageMenuOpen(false);
  };

  return (
    <div className="topbar-actions">
      <button
        className="mobile-menu"
        onClick={() => window.dispatchEvent(new Event("ecybercafe:open-mobile-nav"))}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <button className="icon-button" aria-label="Search" onClick={openSearch}>
        <Search size={18} />
      </button>
      <div className="language-switcher" ref={languageSwitcherRef}>
        <button
          className="language-button"
          onClick={() => setLanguageMenuOpen((open) => !open)}
          aria-label={language === "en" ? "Language" : "भाषा"}
          aria-expanded={languageMenuOpen}
          aria-haspopup="menu"
        >
          <Globe2 size={16} /> {language === "en" ? "EN" : "हिन्दी"} <ChevronDown size={13} />
        </button>
        <div className="language-menu" role="menu" style={{ display: languageMenuOpen ? "grid" : "none" }}>
          <button role="menuitem" onClick={() => changeLanguage("en")}>English</button>
          <button role="menuitem" onClick={() => changeLanguage("hi")}>हिन्दी</button>
        </div>
      </div>
    </div>
  );
}

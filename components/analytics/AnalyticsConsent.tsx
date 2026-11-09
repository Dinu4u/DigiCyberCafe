"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const consentStorageKey = "digicybercafe-analytics-consent";
const preferencesEventName = "digicybercafe:open-analytics-preferences";

if (gtmId && !/^GTM-[A-Z0-9]+$/i.test(gtmId)) {
  throw new Error("NEXT_PUBLIC_GTM_ID must be a valid GTM container ID.");
}

type ConsentChoice = "granted" | "denied";
type ConsentListener = () => void;

declare global {
  interface Window {
    dataLayer?: (IArguments | Record<string, unknown>)[];
    gtag?: (
      command: "consent",
      action: "update",
      settings: Record<string, string>,
    ) => void;
  }
}

const consentListeners = new Set<ConsentListener>();

function subscribeToConsent(listener: ConsentListener) {
  consentListeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    consentListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getConsentSnapshot(): ConsentChoice | null {
  const storedChoice = window.localStorage.getItem(consentStorageKey);
  return storedChoice === "granted" || storedChoice === "denied"
    ? storedChoice
    : null;
}

function getServerConsentSnapshot(): null {
  return null;
}

function persistConsentChoice(choice: ConsentChoice) {
  window.localStorage.setItem(consentStorageKey, choice);
  for (const listener of consentListeners) listener();
}

function updateAnalyticsConsent(choice: ConsentChoice) {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  if (choice === "denied") {
    const googleAnalyticsCookies = document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("=")[0])
      .filter((name) => /^(_ga(?:_|$)|_gid$|_gat(?:_|$)|_gac_)/.test(name));

    for (const name of googleAnalyticsCookies) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.digicybercafe.online; SameSite=Lax`;
    }
  }
}

export function AnalyticsConsent() {
  const choice = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(preferencesEventName, openPreferences);
    return () => window.removeEventListener(preferencesEventName, openPreferences);
  }, []);

  if (!gtmId) return null;
  const saveChoice = (nextChoice: ConsentChoice) => {
    persistConsentChoice(nextChoice);
    updateAnalyticsConsent(nextChoice);
    setPreferencesOpen(false);
  };

  return (
    <>
      {choice === "granted" && (
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w.gtag=function(){w[l].push(arguments);};w.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted'});w.gtag('consent','update',{analytics_storage:'granted'});w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}
      {(preferencesOpen || choice === null) && (
        <aside
          aria-label="Analytics preferences"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] sm:p-6"
          role="dialog"
          aria-modal="false"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="font-semibold text-slate-900">Analytics preferences</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Allow Google Analytics to measure site visits? Analytics stays
                off unless you opt in. You can change this choice later in the
                footer. See our{" "}
                <a className="underline underline-offset-2" href="/privacy-policy">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => saveChoice("denied")}
                type="button"
              >
                Reject analytics
              </button>
              <button
                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
                onClick={() => saveChoice("granted")}
                type="button"
              >
                Allow analytics
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

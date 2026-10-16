"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type AnalyticsChoice = "accepted" | "rejected";
type TrackingState = "idle" | "loading" | "ready" | "error";

const CONSENT_STORAGE_KEY = "ecybercafe.analytics-consent.v1";
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-RJPXQHF432";
const hasValidMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId);

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsSettingsButton() {
  return (
    <button
      className="text-slate-500 underline underline-offset-2 hover:text-slate-900"
      onClick={() => window.dispatchEvent(new Event("ecybercafe:analytics-settings"))}
      type="button"
    >
      Analytics settings
    </button>
  );
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<AnalyticsChoice | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");

  useEffect(() => {
    const storedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    queueMicrotask(() => {
      if (storedChoice === "accepted" || storedChoice === "rejected") {
        setChoice(storedChoice);
        if (storedChoice === "accepted") setTrackingState("loading");
      }
      setInitialized(true);
    });

    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("ecybercafe:analytics-settings", openSettings);
    return () => window.removeEventListener("ecybercafe:analytics-settings", openSettings);
  }, []);

  useEffect(() => {
    if (!initialized || choice !== "accepted" || !hasValidMeasurementId) return;

    const onLoad = () => setTrackingState("ready");
    const onError = () => {
      console.error("Google Analytics could not load. Check the GA4 Measurement ID and network access.");
      setTrackingState("error");
    };
    let script = document.querySelector<HTMLScriptElement>("#google-analytics-script");
    let active = true;

    if (!window.gtag) {
      window.dataLayer ??= [];
      window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });
    }

    if (script?.dataset.loaded === "true") {
      queueMicrotask(() => {
        if (active) setTrackingState("ready");
      });
    } else {
      if (!script) {
        const analyticsScript = document.createElement("script");
        script = analyticsScript;
        analyticsScript.id = "google-analytics-script";
        analyticsScript.async = true;
        analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        analyticsScript.addEventListener("load", () => {
          analyticsScript.dataset.loaded = "true";
          onLoad();
        }, { once: true });
        analyticsScript.addEventListener("error", onError, { once: true });
        document.head.append(analyticsScript);
      } else {
        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
      }
    }

    return () => {
      active = false;
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, [choice, initialized]);

  useEffect(() => {
    if (choice !== "accepted" || trackingState !== "ready" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [choice, pathname, trackingState]);

  const saveChoice = useCallback((nextChoice: AnalyticsChoice) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice);
    setChoice(nextChoice);
    setSettingsOpen(false);
    setTrackingState(nextChoice === "accepted" ? "loading" : "idle");

  }, []);

  if (!initialized) return null;
  const showConsentNotice = hasValidMeasurementId && choice === null;

  if (!showConsentNotice && !settingsOpen) return null;

  return (
    <section
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl"
      role="region"
    >
      <h2 className="text-base font-semibold text-slate-900" id="analytics-consent-title">
        {showConsentNotice ? "Your analytics choice" : "Privacy settings"}
      </h2>
      <p className="mt-2 text-sm leading-6">
        {hasValidMeasurementId
          ? "With your permission, Google Analytics helps us understand visits and improve the site. It may use cookies or similar technologies. You can use the site whether you accept or reject analytics, and you can change this choice in the footer."
          : "Google Analytics is not configured, so no analytics tracking is active. You can change your choice here after a Measurement ID is configured."}
      </p>
      {trackingState === "error" && (
        <p className="mt-2 text-sm text-rose-700" role="status">
          Google Analytics could not load. Your choice is saved; check the Measurement ID or browser network settings.
        </p>
      )}
      {trackingState === "loading" && (
        <p className="mt-2 text-sm text-slate-500" role="status">Loading Google Analytics…</p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {hasValidMeasurementId && (
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => saveChoice("rejected")}
            type="button"
          >
            Reject analytics
          </button>
        )}
        {hasValidMeasurementId && (
          <button
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
            onClick={() => saveChoice("accepted")}
            type="button"
          >
            Accept analytics
          </button>
        )}
        {!showConsentNotice && (
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => setSettingsOpen(false)}
            type="button"
          >
            Close
          </button>
        )}
      </div>
    </section>
  );
}

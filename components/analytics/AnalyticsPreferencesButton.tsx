"use client";

const preferencesEventName = "digicybercafe:open-analytics-preferences";

export function AnalyticsPreferencesButton() {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return null;

  return (
    <button
      className="underline underline-offset-2 hover:text-slate-900"
      onClick={() => window.dispatchEvent(new Event(preferencesEventName))}
      type="button"
    >
      Analytics settings
    </button>
  );
}

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AD_CONFIG } from "@/config/adPolicy";
import type { AdFormat, AdProviderConfig, AdSlotState } from "@/types/advertising";

type Props = {
  slotId: string;
  format: AdFormat;
  className?: string;
  providerConfig?: AdProviderConfig;
};

type GoogleAdSlot = { addService: (service: unknown) => GoogleAdSlot };
type GoogleTag = {
  cmd: { push: (callback: () => void) => void };
  defineSlot: (path: string, sizes: number[][], elementId: string) => GoogleAdSlot | null;
  pubads: () => unknown;
  enableServices: () => void;
  display: (elementId: string) => void;
  destroySlots: (slots?: GoogleAdSlot[]) => boolean;
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
    googletag?: GoogleTag;
  }
}

const formatStyles: Record<AdFormat, { minHeight: number; minWidth: number; maxWidth?: string; sizes: number[][]; label: string }> = {
  leaderboard: {
    minHeight: Number.parseInt(AD_CONFIG.SLOT_DIMENSIONS.leaderboard.minHeight, 10),
    minWidth: 0,
    maxWidth: AD_CONFIG.SLOT_DIMENSIONS.leaderboard.maxWidth,
    sizes: [[728, 90], [320, 50]],
    label: "Responsive banner",
  },
  rectangle: {
    minHeight: Number.parseInt(AD_CONFIG.SLOT_DIMENSIONS.rectangle.minHeight, 10),
    minWidth: 300,
    maxWidth: AD_CONFIG.SLOT_DIMENSIONS.rectangle.maxWidth,
    sizes: [[300, 250]],
    label: "In-content banner",
  },
  "sticky-bottom": {
    minHeight: Number.parseInt(AD_CONFIG.SLOT_DIMENSIONS.responsive.minHeight, 10),
    minWidth: 320,
    sizes: [[320, 100], [320, 50]],
    label: "Mobile banner",
  },
  responsive: {
    minHeight: Number.parseInt(AD_CONFIG.SLOT_DIMENSIONS.responsive.minHeight, 10),
    minWidth: 0,
    sizes: [[320, 100], [320, 50]],
    label: "Responsive banner",
  },
};

let adsenseScript: Promise<void> | undefined;
let googleAdManagerScript: Promise<void> | undefined;

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Ad provider script failed to load.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Ad provider script failed to load."));
    };
    document.head.append(script);
  });
}

function configuredProvider(slotId: string): AdProviderConfig | undefined {
  const adsenseClient = AD_CONFIG.CLIENT_ID;
  if (!/^ca-pub-\d+$/.test(adsenseClient)) return undefined;
  const adsenseSlot = {
    "home-leaderboard": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_LEADERBOARD,
    "invoice-rectangle": process.env.NEXT_PUBLIC_ADSENSE_SLOT_INVOICE_RECTANGLE,
    "exam-age-leaderboard": process.env.NEXT_PUBLIC_ADSENSE_SLOT_EXAM_AGE_LEADERBOARD,
    "mutual-fund-leaderboard": process.env.NEXT_PUBLIC_ADSENSE_SLOT_MUTUAL_FUND_LEADERBOARD,
    "photo-tool-leaderboard": process.env.NEXT_PUBLIC_ADSENSE_SLOT_PHOTO_TOOL_LEADERBOARD,
  }[slotId];
  if (adsenseSlot && /^\d+$/.test(adsenseSlot)) {
    return { provider: "adsense", clientId: adsenseClient, adSlot: adsenseSlot };
  }
  const networkCode = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE;
  if (networkCode) {
    return { provider: "google-ad-manager", adUnitPath: `/${networkCode}/${slotId}` };
  }
  return undefined;
}

function validateCustomAdSource(src: string): string | null {
  try {
    const url = new URL(src);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function AdBannerSlot({ slotId, format, className = "", providerConfig }: Props) {
  const generatedId = useId().replace(/:/g, "");
  const elementId = `ad-${generatedId}`;
  const adRef = useRef<HTMLModElement>(null);
  const gamSlotRef = useRef<GoogleAdSlot | null>(null);
  const [state, setState] = useState<AdSlotState>("loading");
  const provider = useMemo(
    () => AD_CONFIG.MODE === "LIVE_ADSENSE" ? providerConfig ?? configuredProvider(slotId) : undefined,
    [providerConfig, slotId],
  );
  const formatConfig = formatStyles[format];
  const customSrc = provider?.provider === "custom" ? validateCustomAdSource(provider.src) : null;
  const slotState: AdSlotState = !provider || (provider.provider === "custom" && !customSrc) ? "fallback" : state;

  useEffect(() => {
    if (!provider || provider.provider === "custom" || !customSrc) return;
    let active = true;

    const loadAd = async () => {
      try {
        if (provider.provider === "adsense") {
          const scriptUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(provider.clientId)}`;
          adsenseScript ??= loadScript(scriptUrl, "google-adsense-sdk");
          await adsenseScript;
          if (!active || !adRef.current) return;
          window.adsbygoogle ??= [];
          window.adsbygoogle.push({});
        } else {
          googleAdManagerScript ??= loadScript(
            "https://securepubads.g.doubleclick.net/tag/js/gpt.js",
            "google-ad-manager-sdk",
          ).then(() => {
            if (!window.googletag) throw new Error("Google Ad Manager is unavailable.");
          });
          await googleAdManagerScript;
          if (!active) return;
          const googletag = window.googletag;
          if (!googletag) throw new Error("Google Ad Manager is unavailable.");
          const pubads = googletag.pubads();
          googletag.cmd.push(() => {
            if (!active) return;
            try {
              const slot = googletag.defineSlot(provider.adUnitPath, formatConfig.sizes, elementId);
              if (!slot) {
                setState("fallback");
                return;
              }
              gamSlotRef.current = slot.addService(pubads);
              googletag.enableServices();
              googletag.display(elementId);
              if (active) setState("loaded");
            } catch {
              if (active) setState("fallback");
            }
          });
          return;
        }
        if (active) setState("loaded");
      } catch {
        if (provider.provider === "adsense") adsenseScript = undefined;
        else googleAdManagerScript = undefined;
        if (active) setState("fallback");
      }
    };

    void loadAd();
    return () => {
      active = false;
      if (provider.provider === "google-ad-manager" && gamSlotRef.current) {
        const slot = gamSlotRef.current;
        gamSlotRef.current = null;
        window.googletag?.cmd.push(() => {
          window.googletag?.destroySlots([slot]);
        });
      }
    };
  }, [customSrc, elementId, formatConfig.sizes, provider]);

  if (AD_CONFIG.MODE === "DISABLED") return null;

  return (
    <aside
      aria-label={provider ? "Advertisement" : undefined}
      aria-hidden={!provider}
      className={`relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden ${provider ? "rounded-lg border border-slate-200 bg-white/70" : ""} ${format === "rectangle" ? "max-w-[336px]" : ""} ${format === "sticky-bottom" && provider ? "sticky bottom-0 z-30 max-w-[320px] shadow-lg" : ""} ${className}`}
      style={{
        minHeight: formatConfig.minHeight,
        height: formatConfig.minHeight,
        minWidth: 0,
        width: "100%",
        maxWidth: formatConfig.maxWidth,
      }}
      data-ad-state={slotState}
    >
      {provider && <span className="absolute left-2 top-1 text-[9px] uppercase tracking-wide text-slate-400">Advertisement</span>}
      {provider?.provider === "adsense" && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minWidth: formatConfig.minWidth, height: formatConfig.minHeight }}
          data-ad-client={provider.clientId}
          data-ad-slot={provider.adSlot}
          data-ad-format={format === "leaderboard" ? "horizontal" : "auto"}
          data-full-width-responsive="true"
        />
      )}
      {provider?.provider === "google-ad-manager" && (
        <div id={elementId} className="ad-slot-provider" style={{ minHeight: formatConfig.minHeight }} />
      )}
      {customSrc && provider?.provider === "custom" && (
        <iframe
          title={provider.title ?? "Sponsored content"}
          src={customSrc}
          loading="lazy"
          sandbox="allow-scripts allow-forms allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full min-h-full w-full border-0"
          style={{ minHeight: formatConfig.minHeight }}
          onLoad={() => setState("loaded")}
          onError={() => setState("fallback")}
        />
      )}
      {provider && slotState === "fallback" && process.env.NODE_ENV === "development" && (
        <span className="text-xs text-slate-400">{formatConfig.label} · configure an ad provider to serve ads</span>
      )}
    </aside>
  );
}

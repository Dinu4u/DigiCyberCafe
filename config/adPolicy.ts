export type AdMode = "AUDIT_PRE_APPROVAL" | "LIVE_ADSENSE" | "DISABLED";

const adModes: AdMode[] = ["AUDIT_PRE_APPROVAL", "LIVE_ADSENSE", "DISABLED"];
const requestedMode = process.env.NEXT_PUBLIC_AD_MODE;

function isAdMode(value: string | undefined): value is AdMode {
  return adModes.some((mode) => mode === value);
}

export const AD_CONFIG = {
  MODE: isAdMode(requestedMode) ? requestedMode : "AUDIT_PRE_APPROVAL",
  CLIENT_ID:
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT ||
    "ca-pub-XXXXXXXXXXXXXXXX",
  PUBLISHER_INFO: {
    NAME: "Dinesh Kumar",
    LOCATION: "Patna, Bihar — 800024, India",
    EMAIL: "ecybercafe.official@gmail.com",
  },
  INTERSTITIAL: {
    ENABLED: false,
    MIN_ACTIONS_BEFORE_FIRST_AD: 2,
    FREQUENCY_EVERY_N_ACTIONS: 3,
    COOLDOWN_SECONDS: 180,
    FALLBACK_SAFETY_TIMEOUT_MS: 3000,
  },
  SLOT_DIMENSIONS: {
    leaderboard: { minHeight: "90px", width: "100%", maxWidth: "728px" },
    rectangle: { minHeight: "250px", width: "100%", maxWidth: "300px" },
    responsive: { minHeight: "100px", width: "100%" },
  },
} as const;

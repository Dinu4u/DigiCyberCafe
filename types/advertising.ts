export type AdFormat = "leaderboard" | "rectangle" | "sticky-bottom" | "responsive";

export type AdProviderConfig =
  | {
      provider: "adsense";
      clientId: string;
      adSlot: string;
    }
  | {
      provider: "google-ad-manager";
      adUnitPath: string;
    }
  | {
      provider: "custom";
      src: string;
      title?: string;
    };

export type AdSlotState = "loading" | "loaded" | "fallback";

export type ToolFaq = {
  question: string;
  answer: string;
};

export type ToolHowToStep = {
  name: string;
  text: string;
};

export type Locale = "ar" | "en";

const en = {
  "start.title": "What do you want to build today?",
  "start.placeholder": "Describe your idea…",
  "start.cta": "Start",
  "tab.chat": "Chat",
  "tab.app": "My App",
  "nav.start": "Start",
  "nav.build": "Build",
  "nav.publish": "Publish",
  "lang.switch": "العربية",
} as const;

export type MessageKey = keyof typeof en;

const ar: Record<MessageKey, string> = {
  "start.title": "شو بدك تصنع اليوم؟",
  "start.placeholder": "احكِ فكرتك…",
  "start.cta": "ابدأ",
  "tab.chat": "الشات",
  "tab.app": "تطبيقي",
  "nav.start": "البداية",
  "nav.build": "البناء",
  "nav.publish": "النشر",
  "lang.switch": "English",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, ar };
export const dir = (l: Locale): "rtl" | "ltr" => (l === "ar" ? "rtl" : "ltr");
export const t = (l: Locale, k: MessageKey): string => messages[l][k];
export const formatNumber = (l: Locale, n: number): string =>
  new Intl.NumberFormat(l === "ar" ? "ar-AE" : "en-AE").format(n);

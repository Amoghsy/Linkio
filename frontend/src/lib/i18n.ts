/**
 * Lightweight i18n helper for Linkio.
 * Supports: English (en), Kannada (kn), Hindi (hi).
 * Usage: t("search.title", lang)
 */

type Lang = "en" | "kn" | "hi";

const translations: Record<string, Record<Lang, string>> = {
  // --- Search Page ---
  "search.title": {
    en: "Find your perfect match",
    kn: "ನಿಮ್ಮ ಉತ್ತಮ ಕೆಲಸಗಾರನನ್ನು ಹುಡುಕಿ",
    hi: "अपना परफेक्ट मैच खोजें",
  },
  "search.subtitle": {
    en: "Search by skill, name, or category — or tap the mic.",
    kn: "ಕೌಶಲ್ಯ, ಹೆಸರು, ಅಥವಾ ವರ್ಗದಿಂದ ಹುಡುಕಿ — ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ.",
    hi: "कौशल, नाम या श्रेणी से खोजें — या माइक दबाएं।",
  },
  "search.placeholder": {
    en: "Search plumber, electrician, AC repair…",
    kn: "ಪ್ಲಂಬರ್, ಎಲೆಕ್ಟ್ರಿಶಿಯನ್, AC ರಿಪೇರಿ ಹುಡುಕಿ…",
    hi: "प्लंबर, इलेक्ट्रीशियन, AC रिपेयर खोजें…",
  },
  "search.workers_nearby": {
    en: "workers nearby",
    kn: "ಹತ್ತಿರದ ಕೆಲಸಗಾರರು",
    hi: "पास के कामगार",
  },
  "search.searching": {
    en: "Searching…",
    kn: "ಹುಡುಕುತ್ತಿದ್ದೇನೆ…",
    hi: "खोज रहे हैं…",
  },
  "search.no_workers": {
    en: "No workers found",
    kn: "ಯಾವ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ",
    hi: "कोई कामगार नहीं मिला",
  },
  "search.emergency_toggle": {
    en: "Emergency Service",
    kn: "ತುರ್ತು ಸೇವೆ",
    hi: "आपातकालीन सेवा",
  },
  "search.high_demand": {
    en: "High demand services today",
    kn: "ಇಂದು ಹೆಚ್ಚು ಬೇಡಿಕೆಯ ಸೇವೆಗಳು",
    hi: "आज उच्च मांग वाली सेवाएं",
  },

  // --- Booking Page ---
  "booking.emergency": {
    en: "Emergency booking",
    kn: "ತುರ್ತು ಬುಕಿಂಗ್",
    hi: "आपातकालीन बुकिंग",
  },
  "booking.language": {
    en: "Preferred language",
    kn: "ಆದ್ಯತೆಯ ಭಾಷೆ",
    hi: "पसंदीदा भाषा",
  },
  "booking.confirm": {
    en: "Confirm booking",
    kn: "ಬುಕಿಂಗ್ ದೃಢಪಡಿಸಿ",
    hi: "बुकिंग पुष्टि करें",
  },

  // --- Job Tracking ---
  "job.live_location": {
    en: "Live worker location",
    kn: "ನೇರ ಕೆಲಸಗಾರ ಸ್ಥಳ",
    hi: "लाइव कामगार लोकेशन",
  },

  // --- Chat ---
  "chat.typing": {
    en: "typing…",
    kn: "ಟೈಪ್ ಮಾಡುತ್ತಿದ್ದಾರೆ…",
    hi: "टाइप कर रहे हैं…",
  },
  "chat.placeholder": {
    en: "Type a message...",
    kn: "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...",
    hi: "संदेश टाइप करें...",
  },

  // --- Filters ---
  "filter.language": {
    en: "Language",
    kn: "ಭಾಷೆ",
    hi: "भाषा",
  },
  "filter.emergency": {
    en: "Emergency only",
    kn: "ಕೇವಲ ತುರ್ತು",
    hi: "केवल आपातकाल",
  },

  // --- General ---
  "lang.english": { en: "English", kn: "ಇಂಗ್ಲಿಷ್", hi: "अंग्रेज़ी" },
  "lang.kannada": { en: "Kannada", kn: "ಕನ್ನಡ", hi: "कन्नड़" },
  "lang.hindi": { en: "Hindi", kn: "ಹಿಂದಿ", hi: "हिंदी" },
};

/** Translate a key into the given language. Falls back to English if missing. */
export const t = (key: string, lang: Lang = "en"): string =>
  translations[key]?.[lang] ?? translations[key]?.en ?? key;

export type { Lang };
export const SUPPORTED_LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "hi", label: "हिंदी" },
];

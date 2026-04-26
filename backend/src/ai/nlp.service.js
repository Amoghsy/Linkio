import { geminiGenerate } from "../config/gemini.js";
import { normalizeCategory, normalizeText, splitQueryTerms, toNumber } from "../services/worker-search.utils.js";

const SEARCH_HINTS = [
    { pattern: /plumb|pipe|leak|tap|water|drain|toilet/i, category: "plumber", keywords: ["plumber", "pipe", "leak"] },
    { pattern: /electric|wire|switch|fan|light|socket|wiring/i, category: "electrician", keywords: ["electrician", "wiring"] },
    { pattern: /carpen|wood|furniture|door|window|cabinet/i, category: "carpenter", keywords: ["carpenter", "wood"] },
    { pattern: /ac|air.?con|cooling|hvac|air conditioner/i, category: "ac repair", keywords: ["ac repair", "cooling"] },
    { pattern: /clean|sweep|mop|dust|wash|maid/i, category: "cleaner", keywords: ["cleaner", "cleaning"] },
    { pattern: /paint|painting|wall paint/i, category: "painter", keywords: ["painter", "painting"] },
    { pattern: /garden|gardening|lawn|plants/i, category: "gardener", keywords: ["gardener", "gardening"] },
    { pattern: /appliance|fridge|washing machine|microwave|oven/i, category: "appliance", keywords: ["appliance", "repair"] },
];

const LANGUAGE_HINTS = [
    { pattern: /\benglish\b/i, language: "en" },
    { pattern: /\bhindi\b/i, language: "hi" },
    { pattern: /\bkannada\b/i, language: "kn" },
    { pattern: /\btamil\b/i, language: "ta" },
    { pattern: /\btelugu\b/i, language: "te" },
];

const extractJsonObject = (value) => {
    if (!value) return null;

    const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1];
    const candidate = fenced ?? value;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }
};

const parseKeywordSignals = (text) => {
    const normalized = normalizeText(text);
    if (!normalized) {
        return {
            category: "",
            skill: "",
            language: "",
            emergency: false,
            maxDistanceKm: null,
            minRating: null,
            maxPrice: null,
            workerName: "",
            keywords: [],
        };
    }

    const matchedHint = SEARCH_HINTS.find(({ pattern }) => pattern.test(normalized));
    const matchedLanguage = LANGUAGE_HINTS.find(({ pattern }) => pattern.test(normalized));
    const maxDistanceKm = normalized.match(/(?:within|under|inside)\s+(\d{1,2})\s*km/i)?.[1];
    const minRating = normalized.match(/(?:rating|rated)\s*(?:above|over|at least)?\s*(\d(?:\.\d)?)/i)?.[1];
    const maxPrice = normalized.match(/(?:under|below|less than|max)\s*(?:rs\.?|inr)?\s*(\d{2,6})/i)?.[1];
    const workerName =
        normalized.match(/(?:named|name is|worker named)\s+([a-z ]{2,40})/i)?.[1]?.trim() ??
        "";

    return {
        category: matchedHint?.category ?? "",
        skill: "",
        language: matchedLanguage?.language ?? "",
        emergency: /\b(urgent|immediately|emergency|asap|right now)\b/i.test(normalized),
        maxDistanceKm: toNumber(maxDistanceKm),
        minRating: toNumber(minRating),
        maxPrice: toNumber(maxPrice),
        workerName: normalizeText(workerName),
        keywords: Array.from(
            new Set([
                ...(matchedHint?.keywords ?? []),
                ...splitQueryTerms(normalized),
            ])
        ),
    };
};

const shouldUseGemini = (text) => {
    const normalized = normalizeText(text);
    if (!normalized) return false;

    const tokens = splitQueryTerms(normalized);
    if (tokens.length >= 3) return true;
    if (/\d/.test(normalized)) return true;

    return /\b(need|looking|find|want|speak|cheap|budget|experienced|urgent|emergency|nearby|within|under)\b/i.test(normalized);
};

const normalizeParsedSignals = (parsed, fallback) => {
    const keywords = Array.isArray(parsed?.keywords)
        ? parsed.keywords.map(normalizeCategory).filter(Boolean)
        : fallback.keywords;

    return {
        category: normalizeCategory(parsed?.category) || fallback.category,
        skill: normalizeCategory(parsed?.skill) || fallback.skill,
        language: normalizeCategory(parsed?.language) || fallback.language,
        emergency:
            typeof parsed?.emergency === "boolean"
                ? parsed.emergency
                : fallback.emergency,
        maxDistanceKm: toNumber(parsed?.maxDistanceKm) ?? fallback.maxDistanceKm,
        minRating: toNumber(parsed?.minRating) ?? fallback.minRating,
        maxPrice: toNumber(parsed?.maxPrice) ?? fallback.maxPrice,
        workerName: normalizeText(parsed?.workerName) || fallback.workerName,
        keywords: Array.from(new Set([...fallback.keywords, ...keywords])),
    };
};

export const keywordFallback = (text) => parseKeywordSignals(text).category || null;

export const extractSearchSignals = async (text) => {
    if (!text || text.trim() === "") {
        throw new Error("Query text is required for classification");
    }

    const fallback = parseKeywordSignals(text);

    if (!shouldUseGemini(text)) {
        return fallback;
    }

    try {
        const prompt = [
            "You extract search filters for a home services marketplace.",
            "Return valid JSON only.",
            'Use this schema: {"category": string|null, "skill": string|null, "language": string|null, "emergency": boolean|null, "maxDistanceKm": number|null, "minRating": number|null, "maxPrice": number|null, "workerName": string|null, "keywords": string[]}.',
            "Normalize service categories to simple labels such as plumber, electrician, carpenter, ac repair, cleaner, painter, gardener, appliance.",
            "If a field is not present in the request, set it to null, false, or [].",
            `Request: "${text}"`,
        ].join("\n");

        const raw = await geminiGenerate(prompt, 15000);
        const parsed = extractJsonObject(raw);

        if (!parsed) {
            return fallback;
        }

        return normalizeParsedSignals(parsed, fallback);
    } catch {
        return fallback;
    }
};

export const classifyService = async (text) => {
    const signals = await extractSearchSignals(text);
    return signals.category || keywordFallback(text) || "plumber";
};

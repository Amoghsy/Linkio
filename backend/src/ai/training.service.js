import { geminiGenerate } from "../config/gemini.js";
import { normalizeText } from "../services/worker-search.utils.js";

const PRIORITIES = new Set(["high", "medium", "low"]);

const DEFAULT_RECOMMENDATIONS = [
    {
        title: "Customer communication",
        reason: "Clear updates and polite explanations increase trust and repeat bookings.",
        action: "Share arrival times, explain the fix in simple language, and confirm pricing before work starts.",
        priority: "medium",
    },
    {
        title: "Service quality checklist",
        reason: "Consistent quality reduces callbacks and improves ratings.",
        action: "Use a short before-and-after checklist for diagnosis, repair, cleanup, and customer confirmation.",
        priority: "medium",
    },
    {
        title: "Safety and professionalism",
        reason: "Safe, organized work creates confidence for customers and admins.",
        action: "Follow tool safety basics, keep the work area tidy, and document completed work with photos or notes.",
        priority: "low",
    },
];

const extractJsonObject = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
};

const sanitizeRecommendation = (item) => {
    if (!item || typeof item !== "object") return null;

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const reason = typeof item.reason === "string" ? item.reason.trim() : "";
    const action = typeof item.action === "string" ? item.action.trim() : "";
    const priority = typeof item.priority === "string" ? item.priority.trim().toLowerCase() : "medium";

    if (!title || !reason || !action) {
        return null;
    }

    return {
        title,
        reason,
        action,
        priority: PRIORITIES.has(priority) ? priority : "medium",
    };
};

const keywordRecommendation = (comments, worker) => {
    const text = normalizeText(comments.join(" "));
    const matches = [];

    if (
        /(late|delay|slow|wait|waiting|time|timing|arrival|schedule|punctual)/.test(text)
    ) {
        matches.push({
            title: "Punctuality and scheduling",
            reason: "Feedback suggests customers notice delays or inconsistent arrival updates.",
            action: "Use tighter scheduling windows, send ETA updates earlier, and confirm visit times before travel.",
            priority: "high",
        });
    }

    if (
        /(rude|communication|explain|understand|language|behavior|attitude|polite)/.test(text)
    ) {
        matches.push({
            title: "Communication and customer handling",
            reason: "Some feedback points to gaps in clarity, tone, or language comfort.",
            action: "Practice short status updates, confirm the customer's preferred language, and explain work before starting.",
            priority: "high",
        });
    }

    if (/(price|cost|charge|expensive|quote|budget|overcharge)/.test(text)) {
        matches.push({
            title: "Transparent pricing",
            reason: "Customers are sensitive to unclear or unexpected charges.",
            action: "Share a simple estimate upfront, explain add-on costs, and reconfirm the final amount before closing the job.",
            priority: "medium",
        });
    }

    if (/(dirty|mess|cleanup|clean|dust|left)/.test(text)) {
        matches.push({
            title: "Cleanup and finish quality",
            reason: "Work quality is judged both by the fix and by how the site is left.",
            action: "Add a cleanup step before leaving and ask the customer to confirm the area is in good condition.",
            priority: "medium",
        });
    }

    if (/(repeat|again|rework|issue|problem|quality|fix|resolved|solve)/.test(text)) {
        matches.push({
            title: "First-time fix quality",
            reason: "Feedback suggests an opportunity to improve diagnosis or repair consistency.",
            action: `Review advanced ${worker?.category || "service"} troubleshooting steps and finish every job with a final functional check.`,
            priority: "high",
        });
    }

    return matches;
};

export const buildFallbackTrainingInsights = ({ worker = {}, reviews = [] }) => {
    const comments = reviews
        .map((review) => review.comment)
        .filter((comment) => typeof comment === "string" && comment.trim());

    const recommendations = keywordRecommendation(comments, worker);

    if (recommendations.length === 0) {
        recommendations.push(
            {
                title: `Advanced ${worker.category || "service"} practice`,
                reason: "Skill depth helps workers solve jobs faster and with fewer callbacks.",
                action: `Set aside weekly practice time for advanced ${worker.category || "service"} troubleshooting and common edge cases.`,
                priority: "medium",
            },
            ...DEFAULT_RECOMMENDATIONS
        );
    }

    const summary =
        reviews.length === 0
            ? "No customer feedback yet. Start with foundational service, communication, and quality habits to build strong early ratings."
            : comments.length === 0
                ? "Ratings are available, but written feedback is limited. Focus on communication, work quality, and consistency to keep improving."
                : "Recent feedback points to a few practical coaching opportunities. Focus on the highest-priority habits first to improve customer satisfaction.";

    return {
        summary,
        recommendations: recommendations.slice(0, 4),
    };
};

export const generateTrainingInsights = async ({ worker = {}, reviews = [] }) => {
    const fallback = buildFallbackTrainingInsights({ worker, reviews });

    if (reviews.length === 0) {
        return fallback;
    }

    const reviewLines = reviews
        .slice(0, 12)
        .map((review, index) => {
            const rating = Number(review.rating ?? 0);
            const comment = typeof review.comment === "string" ? review.comment.trim() : "";
            return `${index + 1}. rating=${rating}; comment=${comment || "No comment"}`;
        })
        .join("\n");

    const prompt = [
        "You are a vocational coach for local service professionals.",
        "Analyze the customer feedback and produce a compact JSON object only.",
        'Return this exact schema: {"summary":"...","recommendations":[{"title":"...","reason":"...","action":"...","priority":"high|medium|low"}]}',
        "Keep summary under 45 words. Return 2 to 4 recommendations.",
        `Worker category: ${worker.category || "general service"}`,
        `Worker skills: ${(worker.skills || []).join(", ") || "not provided"}`,
        `Average rating: ${worker.rating ?? 0}`,
        "Customer feedback:",
        reviewLines,
    ].join("\n");

    try {
        const raw = await geminiGenerate(prompt, 7000);
        const parsed = extractJsonObject(raw);
        const recommendations = Array.isArray(parsed?.recommendations)
            ? parsed.recommendations.map(sanitizeRecommendation).filter(Boolean)
            : [];
        const summary =
            typeof parsed?.summary === "string" && parsed.summary.trim()
                ? parsed.summary.trim()
                : fallback.summary;

        if (recommendations.length === 0) {
            return fallback;
        }

        return {
            summary,
            recommendations: recommendations.slice(0, 4),
        };
    } catch {
        return fallback;
    }
};

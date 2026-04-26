import { db } from "../config/firebase.js";
import { calculateTrustScore } from "../ai/trustScore.service.js";
import { geminiGenerate } from "../config/gemini.js";
import { getWorkerInsightsSnapshot } from "./worker-insights.service.js";
import { buildFallbackTrainingInsights } from "../ai/training.service.js";

// Returns "" for empty/blank strings, lowercase for non-empty, undefined for non-strings
const normalizeCategory = (category) => {
    if (typeof category !== "string") return undefined;
    const trimmed = category.trim();
    return trimmed ? trimmed.toLowerCase() : "";
};

const normalizeStringArray = (value) =>
    Array.isArray(value)
        ? value
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => item.trim().toLowerCase())
        : undefined;

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const isWorkerAvailable = (worker) => worker.availability ?? worker.available ?? true;

const calculateDistanceKm = (originLat, originLng, destinationLat, destinationLng) => {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(destinationLat - originLat);
    const dLng = toRad(destinationLng - originLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(originLat)) *
            Math.cos(toRad(destinationLat)) *
            Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeWorkerData = (data = {}) => {
    const normalized = { ...data };

    if (normalized.category !== undefined) {
        // ?? "" ensures category is never undefined going into Firestore
        normalized.category = normalizeCategory(normalized.category) ?? "";
    }

    const normalizedLanguages = normalizeStringArray(normalized.languages);
    if (normalizedLanguages) {
        normalized.languages = normalizedLanguages;
    }

    if (normalized.available !== undefined && normalized.availability === undefined) {
        normalized.availability = Boolean(normalized.available);
    }

    if (normalized.availability !== undefined && normalized.available === undefined) {
        normalized.available = Boolean(normalized.availability);
    }

    return normalized;
};

const getWorkerLatLng = (worker) => {
    const lat = toNumber(worker.location?.lat ?? worker.lat);
    const lng = toNumber(worker.location?.lng ?? worker.lng);

    if (lat === null || lng === null) {
        return null;
    }

    return { lat, lng };
};

const mapWorkerDoc = (doc) => {
    const data = doc.data() || {};
    return {
        id: doc.id,
        ...data,
        category: normalizeCategory(data.category) ?? data.category,
        languages: normalizeStringArray(data.languages) ?? data.languages ?? [],
        availability: data.availability ?? data.available ?? true,
        available: data.available ?? data.availability ?? true,
    };
};

export const createWorker = async (data) => {
    try {
        if (!data.userId) throw new Error("userId is required");

        const workerData = {
            ...normalizeWorkerData(data),
            rating: data.rating || 0,
            completedJobs: data.completedJobs || 0,
            cancelledJobs: data.cancelledJobs || 0,
            availability: data.availability ?? data.available ?? true,
            available: data.available ?? data.availability ?? true,
            createdAt: new Date(),
        };
        workerData.trustScore = calculateTrustScore(workerData);

        const ref = db.collection("workers").doc(data.userId);
        const existing = await ref.get();
        if (existing.exists) throw new Error("Worker already exists");

        await ref.set(workerData);
        return workerData;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const getWorkers = async (filters = {}) => {
    const { skill, category, query, q, lat, lng, radius, maxDistance, minRating, maxPrice, language, emergency } = filters;

    let workerQuery = db.collection("workers");

    const normalizedCategory = normalizeCategory(category ?? query ?? q);
    if (normalizedCategory) {
        workerQuery = workerQuery.where("category", "==", normalizedCategory);
    }

    if (skill) {
        workerQuery = workerQuery.where("skills", "array-contains", skill);
    }

    const snapshot = await workerQuery.limit(50).get();
    let workers = snapshot.docs.map(mapWorkerDoc);

    if (workers.length === 0 && normalizedCategory) {
        const fallbackSnapshot = await db.collection("workers").limit(50).get();
        workers = fallbackSnapshot.docs
            .map(mapWorkerDoc)
            .filter((worker) => normalizeCategory(worker.category) === normalizedCategory);
    }

    workers = workers.filter((worker) => isWorkerAvailable(worker));

    const normalizedLanguage = typeof language === "string" && language.trim() ? language.trim().toLowerCase() : "";
    if (normalizedLanguage) {
        workers = workers.filter((worker) => worker.languages?.includes(normalizedLanguage));
    }

    const parsedMinRating = toNumber(minRating);
    if (parsedMinRating !== null && parsedMinRating > 0) {
        workers = workers.filter((worker) => Number(worker.rating) >= parsedMinRating);
    }

    const parsedLat = toNumber(lat);
    const parsedLng = toNumber(lng);
    const parsedRadius = toNumber(radius ?? maxDistance);

    // Geo-filter in memory if lat/lng and a radius-like filter are provided
    if (parsedLat !== null && parsedLng !== null && parsedRadius !== null && parsedRadius > 0) {
        workers = workers.filter((worker) => {
            const coords = getWorkerLatLng(worker);
            if (!coords) return false;
            const distanceKm = calculateDistanceKm(parsedLat, parsedLng, coords.lat, coords.lng);
            worker.distanceKm = Number(distanceKm.toFixed(1));
            worker.lat = coords.lat;
            worker.lng = coords.lng;
            return distanceKm <= parsedRadius;
        });
    } else {
        workers = workers.map((worker) => {
            const coords = getWorkerLatLng(worker);
            return {
                ...worker,
                lat: coords?.lat ?? worker.lat,
                lng: coords?.lng ?? worker.lng,
                distanceKm: worker.distanceKm ?? 0,
            };
        });
    }

    const parsedMaxPrice = toNumber(maxPrice);
    if (parsedMaxPrice !== null && parsedMaxPrice > 0) {
        workers = workers.filter((w) => Number(w.priceFrom) <= parsedMaxPrice);
    }

    if (emergency === true || emergency === "true") {
        workers = workers.filter((worker) => isWorkerAvailable(worker));
    }

    return workers.sort((a, b) => b.rating - a.rating);
};

export const getWorkerCategories = async () => {
    const snapshot = await db.collection("workers").get();
    const categories = new Set();

    snapshot.forEach((doc) => {
        const data = doc.data() || {};

        if (Array.isArray(data.skills)) {
            data.skills.forEach((skill) => {
                if (typeof skill === "string" && skill.trim()) {
                    categories.add(skill.trim());
                }
            });
        }

        if (typeof data.category === "string" && data.category.trim()) {
            categories.add(data.category.trim().toLowerCase());
        }
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
};

export const getWorker = async (id) => {
    const doc = await db.collection("workers").doc(id).get();
    if (!doc.exists) return null;
    return mapWorkerDoc(doc);
};

export const updateWorker = async (id, updates) => {
    const ref = db.collection("workers").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const updated = { ...normalizeWorkerData(updates), updatedAt: new Date() };
    // Recalculate trust score if rating-related fields changed
    if (updates.rating !== undefined || updates.completedJobs !== undefined || updates.cancelledJobs !== undefined) {
        updated.trustScore = calculateTrustScore({ ...doc.data(), ...updated });
    }
    await ref.update(updated);
    return { id, ...doc.data(), ...updated };
};

export const updateAvailability = async (id, availability) => {
    const ref = db.collection("workers").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update({ availability, available: availability, updatedAt: new Date() });
    return { id, availability, available: availability };
};

export const getEarnings = async (workerId) => {
    // Get all completed jobs for this worker
    const snapshot = await db.collection("jobs")
        .where("workerId", "==", workerId)
        .where("status", "==", "completed")
        .get();
        
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let totalEarnings = 0;
    let thisMonth = 0;
    const now = new Date();
    const history = [];
    
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        weeklyData.push({
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            amount: 0,
            dateObj: d
        });
    }
    
    jobs.forEach(job => {
        const amount = job.price || 0;
        totalEarnings += amount;
        
        const jobDate = job.createdAt ? job.createdAt.toDate() : new Date(job.date);
        
        if (jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear()) {
            thisMonth += amount;
        }
        
        weeklyData.forEach(dayInfo => {
            if (dayInfo.dateObj.getDate() === jobDate.getDate() && 
                dayInfo.dateObj.getMonth() === jobDate.getMonth() && 
                dayInfo.dateObj.getFullYear() === jobDate.getFullYear()) {
                dayInfo.amount += amount;
            }
        });
        
        history.push({
            id: job.id,
            date: job.date,
            customer: job.customerName || "Customer",
            amount,
            status: "paid"
        });
    });
    
    // Sort history by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const weekly = weeklyData.map(d => ({ day: d.day, amount: d.amount }));

    return {
        totalEarnings,
        jobsCompleted: jobs.length,
        thisMonth,
        weekly,
        history: history.slice(0, 10) // Return recent history
    };
};

export const getWorkerAnalytics = async (workerId) => {
    const worker = await getWorker(workerId);
    if (!worker) return null;

    const snapshot = await db.collection("jobs")
        .where("workerId", "==", workerId)
        .get();
        
    const jobs = snapshot.docs.map(doc => doc.data());
    const jobsCompleted = jobs.filter(j => j.status === "completed").length;
    const completionRate = jobs.length > 0 ? Math.round((jobsCompleted / jobs.length) * 100) : 100;

    return {
        jobsCompleted: worker.completedJobs || jobsCompleted,
        avgRating: worker.rating || 0,
        responseTimeMinutes: worker.responseTimeMinutes || 15,
        completionRate: worker.completionRate || completionRate
    };
};
export const getWorkerTrainingRecommendations = async (workerId) => {
    // 1️⃣ Try cached insights (fast path)
    const insights = await getWorkerInsightsSnapshot(workerId);
    if (insights) {
        return insights;
    }

    // 2️⃣ Get worker
    const worker = await getWorker(workerId);
    if (!worker) return null;

    // 3️⃣ 🔥 FETCH REAL FEEDBACK (CRITICAL FIX)
    const feedbackSnap = await db
        .collection("feedback")
        .where("workerId", "==", workerId)
        .limit(10)
        .get();

    const reviews = feedbackSnap.docs.map((doc) => {
        const data = doc.data() || {};
        return data.comment || data.text || data.feedback || "";
    }).filter(Boolean);

    // 🧪 DEBUG (remove later)
    console.log("TRAINING FEEDBACK:", reviews);

    // 4️⃣ If no feedback → fallback
    if (reviews.length === 0) {
        const fallback = buildFallbackTrainingInsights({ worker, reviews: [] });

        return {
            workerId,
            summary: fallback.summary,
            recommendations: fallback.recommendations,
            updatedAt: worker.updatedAt || worker.createdAt || null,
            feedbackCount: 0,
            basedOnFeedback: false,
        };
    }

    // 5️⃣ 🔥 STRONG AI PROMPT (NON-GENERIC)
    const prompt = `
You are an AI performance coach for Linkio workers.

Worker details:
- Category: ${worker.category}
- Rating: ${worker.rating || "N/A"}

Customer feedback:
${reviews.join("\n")}

Return ONLY JSON:

{
  "summary": "Short summary of main issues",
  "recommendations": [
    {
      "title": "Short issue title",
      "reason": "Specific issue from feedback",
      "action": "Clear action worker must take",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- NO generic advice
- Every recommendation MUST reference feedback
- Max 3–5 recommendations
`;

    // 6️⃣ Call Gemini
    const aiResponse = await geminiGenerate(prompt);

    let parsed;

    try {
        parsed = JSON.parse(aiResponse);
    } catch (err) {
        console.error("AI Parse Error:", aiResponse);
        throw new Error("Invalid AI response");
    }

    // 7️⃣ Return structured result
    return {
        workerId,
        summary: parsed.summary,
        recommendations: parsed.recommendations,
        updatedAt: new Date().toISOString(),
        feedbackCount: reviews.length,
        basedOnFeedback: true,
    };
};
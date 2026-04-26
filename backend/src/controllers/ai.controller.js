import { classifyService, extractSearchSignals } from "../ai/nlp.service.js";
import { calculateTrustScore } from "../ai/trustScore.service.js";
import { getWorkers } from "../services/worker.service.js";

export const match = async (req, res) => {
    try {
        const { query, location } = req.body;
        if (!query) return res.status(400).json({ error: "query is required" });

        const filters = await extractSearchSignals(query);
        const workers = await getWorkers({
            query,
            lat: location?.lat,
            lng: location?.lng,
            radius: location?.radius,
        });

        res.json({
            category: filters.category || (await classifyService(query)),
            filters,
            workers,
            count: workers.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const classify = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "text is required" });
        const category = await classifyService(text);
        res.json({ category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const trustScore = async (req, res) => {
    try {
        const { rating = 0, completedJobs = 0, cancelledJobs = 0 } = req.body;
        const score = calculateTrustScore({ rating, completedJobs, cancelledJobs });
        res.json({ trustScore: score });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const fraudDetect = async (req, res) => {
    try {
        const { workerId, jobCount, cancelRate, reportCount } = req.body;
        // Mock fraud detection logic — flags if cancel rate > 50% or reports > 5
        const isFlagged = cancelRate > 0.5 || reportCount > 5;
        const riskScore = Math.min(100, (cancelRate * 50) + (reportCount * 10));
        res.json({
            workerId,
            isFlagged,
            riskScore: Math.round(riskScore),
            reason: isFlagged
                ? cancelRate > 0.5
                    ? "High cancellation rate"
                    : "Multiple user reports"
                : "No fraud detected",
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

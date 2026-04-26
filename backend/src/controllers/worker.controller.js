import * as workerService from "../services/worker.service.js";

export const createWorker = async (req, res) => {
    try {
        const worker = await workerService.createWorker({
            ...req.body,
            userId: req.user.uid,
        });
        res.status(201).json(worker);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getWorkers = async (req, res) => {
    try {
        console.log("Filters received:", req.query);
        const { skill, category, query, q, lat, lng, radius, maxDistance, minRating, maxPrice, language, emergency } = req.query;
        const workers = await workerService.getWorkers({
            skill,
            category,
            query,
            q,
            lat,
            lng,
            radius,
            maxDistance,
            minRating,
            maxPrice,
            language,
            emergency,
        });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWorkerCategories = async (req, res) => {
    try {
        const categories = await workerService.getWorkerCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWorker = async (req, res) => {
    try {
        const worker = await workerService.getWorker(req.params.id);
        if (!worker) return res.status(404).json({ error: "Worker not found" });
        res.json(worker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateWorker = async (req, res) => {
    try {
        const worker = await workerService.updateWorker(req.params.id, req.body);
        if (!worker) return res.status(404).json({ error: "Worker not found" });
        res.json(worker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;
        if (typeof availability !== "boolean") {
            return res.status(400).json({ error: "availability must be a boolean" });
        }
        const result = await workerService.updateAvailability(req.params.id, availability);
        if (!result) return res.status(404).json({ error: "Worker not found" });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getEarnings = async (req, res) => {
    try {
        const earnings = await workerService.getEarnings(req.params.id);
        res.json(earnings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWorkerAnalytics = async (req, res) => {
    try {
        const analytics = await workerService.getWorkerAnalytics(req.params.id);
        if (!analytics) return res.status(404).json({ error: "Worker not found" });
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWorkerTrainingRecommendations = async (req, res) => {
    try {
        const training = await workerService.getWorkerTrainingRecommendations(req.params.id);
        if (!training) return res.status(404).json({ error: "Worker not found" });
        res.json(training);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

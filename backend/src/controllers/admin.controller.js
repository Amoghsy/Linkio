import * as adminService from "../services/admin.service.js";

export const getAdminUsers = async (req, res) => {
    try {
        const users = await adminService.getAdminUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAdminWorkers = async (req, res) => {
    try {
        const workers = await adminService.getAdminWorkers();
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAdminJobs = async (req, res) => {
    try {
        const jobs = await adminService.getAdminJobs();
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyWorker = async (req, res) => {
    try {
        const result = await adminService.verifyWorker(req.params.id, req.body);
        if (!result) return res.status(404).json({ error: "Worker not found" });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateWorkerFare = async (req, res) => {
    try {
        const { priceFrom, priceTo } = req.body;
        const result = await adminService.updateWorkerFare(req.params.id, priceFrom, priceTo);
        if (!result) return res.status(404).json({ error: "Worker not found" });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAdminWorker = async (req, res) => {
    try {
        const result = await adminService.deleteWorker(req.params.id);
        if (!result) return res.status(404).json({ error: "Worker not found" });
        res.json({ message: "Worker deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAnalytics = async (req, res) => {
    try {
        const stats = await adminService.getStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Keep old getStats alias for backward compat
export const getStats = getAnalytics;
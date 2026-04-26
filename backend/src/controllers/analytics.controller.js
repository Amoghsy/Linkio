import * as analyticsService from "../services/analytics.service.js";

export const getOverview = async (req, res) => {
    try {
        const data = await analyticsService.getOverview();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getDemand = async (req, res) => {
    try {
        const data = await analyticsService.getDemand();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

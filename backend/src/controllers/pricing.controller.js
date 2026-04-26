import * as pricingService from "../services/pricing.service.js";

export const estimatePrice = async (req, res) => {
    try {
        const { service, location } = req.body;
        const estimate = await pricingService.estimatePrice(service, location);
        res.json(estimate);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

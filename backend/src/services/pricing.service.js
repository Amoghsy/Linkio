import { db } from "../config/firebase.js";

const BASE_PRICES = {
    plumber: 500,
    electrician: 450,
    carpenter: 400,
    ac_technician: 600,
    cleaner: 300,
};

const CITY_MULTIPLIERS = {
    bangalore: 1.2,
    mumbai: 1.3,
    delhi: 1.25,
    hyderabad: 1.1,
    chennai: 1.1,
    default: 1.0,
};

export const estimatePrice = async (service, location) => {
    if (!service || !location) throw new Error("service and location are required");

    const normalizedService = service.toLowerCase().replace(/\s+/g, "_");
    const normalizedCity = location.toLowerCase();
    const base = BASE_PRICES[normalizedService] || 400;
    const multiplier = CITY_MULTIPLIERS[normalizedCity] || CITY_MULTIPLIERS.default;

    const estimate = Math.round(base * multiplier);

    return {
        service,
        location,
        estimatedPrice: estimate,
        currency: "INR",
        breakdown: {
            basePrice: base,
            locationMultiplier: multiplier,
            final: estimate,
        },
        note: "Actual price may vary based on work complexity",
    };
};

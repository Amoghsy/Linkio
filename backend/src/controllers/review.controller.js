import * as reviewService from "../services/review.service.js";

export const createReview = async (req, res) => {
    try {
        const review = await reviewService.createReview({
            ...req.body,
            userId: req.user.uid,
        });
        res.status(201).json(review);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getWorkerReviews = async (req, res) => {
    try {
        const reviews = await reviewService.getWorkerReviews(req.params.workerId);
        res.json(reviews);
    } catch (err) {
        console.error("Error in getWorkerReviews:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const result = await reviewService.deleteReview(req.params.id);
        if (!result) return res.status(404).json({ error: "Review not found" });
        res.json({ message: "Review deleted", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

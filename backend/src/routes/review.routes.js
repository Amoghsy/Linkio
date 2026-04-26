import express from "express";
import { createReview, getWorkerReviews, deleteReview } from "../controllers/review.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createReview);
router.get("/:workerId", verifyToken, getWorkerReviews);
router.delete("/:id", verifyToken, deleteReview);

export default router;

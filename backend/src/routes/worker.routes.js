import express from "express";
import {
    createWorker,
    getWorkerCategories,
    getWorkers,
    getWorker,
    updateWorker,
    updateAvailability,
    getEarnings,
    getWorkerAnalytics,
    getWorkerTrainingRecommendations,
} from "../controllers/worker.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/categories", getWorkerCategories);
router.post("/", verifyToken, createWorker);
router.get("/", verifyToken, getWorkers);          // supports ?skill=&lat=&lng=&radius=
router.get("/:id", verifyToken, getWorker);
router.put("/:id", verifyToken, updateWorker);
router.patch("/:id/availability", verifyToken, updateAvailability);
router.get("/:id/earnings", verifyToken, getEarnings);
router.get("/:id/analytics", verifyToken, getWorkerAnalytics);
router.get("/:id/trainings", verifyToken, getWorkerTrainingRecommendations);

export default router;

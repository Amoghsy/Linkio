import express from "express";
import {
    getAdminUsers,
    getAdminWorkers,
    getAdminJobs,
    verifyWorker,
    updateWorkerFare,
    getAnalytics,
    deleteAdminWorker,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.middleware.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(verifyToken, requireAdmin);

router.get("/users", getAdminUsers);
router.get("/workers", getAdminWorkers);
router.get("/jobs", getAdminJobs);
router.put("/verify-worker/:id", verifyWorker);
router.put("/workers/:id/fare", updateWorkerFare);
router.delete("/workers/:id", deleteAdminWorker);
router.get("/analytics", getAnalytics);

export default router;
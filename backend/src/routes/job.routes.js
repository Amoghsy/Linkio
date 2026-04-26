import express from "express";
import {
    createJob,
    listJobs,
    getJob,
    updateJob,
    updateJobStatus,
    deleteJob,
} from "../controllers/job.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createJob);
router.get("/", verifyToken, listJobs);             // supports ?userId=&status=
router.get("/:id", verifyToken, getJob);
router.put("/:id", verifyToken, updateJob);
router.patch("/:id/status", verifyToken, updateJobStatus);
router.delete("/:id", verifyToken, deleteJob);

export default router;
import express from "express";
import { getOverview, getDemand } from "../controllers/analytics.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", verifyToken, getOverview);
router.get("/demand", verifyToken, getDemand);

export default router;

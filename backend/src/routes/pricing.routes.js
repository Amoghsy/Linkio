import express from "express";
import { estimatePrice } from "../controllers/pricing.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/estimate", verifyToken, estimatePrice);

export default router;

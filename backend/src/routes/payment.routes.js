import express from "express";
import { createPayment, verifyPayment, getUserPayments, getConfig } from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/config", verifyToken, getConfig);
router.post("/create", verifyToken, createPayment);
router.post("/verify", verifyToken, verifyPayment);
router.get("/:userId", verifyToken, getUserPayments);

export default router;
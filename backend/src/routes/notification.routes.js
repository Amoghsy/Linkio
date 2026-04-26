import express from "express";
import { getUserNotifications, markAsRead } from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:userId", verifyToken, getUserNotifications);
router.patch("/:id/read", verifyToken, markAsRead);

export default router;

import express from "express";
import { chat } from "../controllers/chatbot.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/message", verifyToken, chat);

export default router;

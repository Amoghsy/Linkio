import express from "express";
import { sendMessage, getChat, getUserChats } from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send", verifyToken, sendMessage);
router.get("/user/:userId", verifyToken, getUserChats);
router.get("/:chatId", verifyToken, getChat);

export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Must run before any other import that reads env vars

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import jobRoutes from "./routes/job.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import pricingRoutes from "./routes/pricing.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));

// Root
app.get("/", (req, res) => res.send("🚀 Linkio Backend is Running"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/auth", authRoutes);

// Global error handler (catches async errors in Express 5)
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
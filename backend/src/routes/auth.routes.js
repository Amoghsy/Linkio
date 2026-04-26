import express from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { createWorker, updateWorker as updateWorkerProfile } from "../services/worker.service.js";
import { normalizeCategory, normalizeStringArray } from "../services/worker-search.utils.js";

const router = express.Router();

const buildWorkerSignupPayload = (body, fallbackName, phone) => {
    const skills = normalizeStringArray(body.skills);
    const languages = normalizeStringArray(body.languages);

    return {
        name: body.name || fallbackName || "",
        phone: phone || "",
        category: normalizeCategory(body.category) || (skills[0] ? normalizeCategory(skills[0]) : ""),
        skills,
        experienceYears: Number(body.experienceYears ?? body.experience ?? 0) || 0,
        priceFrom: Number(body.priceFrom ?? 0) || 0,
        priceTo: Number(body.priceTo ?? 0) || 0,
        bio: body.bio || "",
        languages: languages.length > 0 ? languages : ["en"],
        verified: false,
    };
};

router.post("/signup", verifyToken, async (req, res) => {
    try {
        const { uid, email, name } = req.user;
        const { role = "user", phone = "" } = req.body;

        const userRef = db.collection("users").doc(uid);
        const existing = await userRef.get();

        const userData = {
            uid,
            email,
            name: name || req.body.name || "",
            phone,
            role,
            createdAt: new Date(),
        };

        const workerData = buildWorkerSignupPayload(req.body, userData.name, phone);

        if (existing.exists) {
            if (role === "worker") {
                const workerRef = db.collection("workers").doc(uid);
                const workerDoc = await workerRef.get();

                if (!workerDoc.exists) {
                    await createWorker({
                        userId: uid,
                        ...workerData,
                    });
                } else if (workerData.category || workerData.skills.length > 0 || workerData.experienceYears > 0) {
                    await updateWorkerProfile(uid, workerData);
                }
            }

            return res.status(200).json({
                message: "User already exists",
                user: { id: existing.id, ...existing.data() },
            });
        }

        await userRef.set(userData);

        if (role === "worker") {
            await createWorker({
                userId: uid,
                ...workerData,
            });
        }

        res.status(201).json({
            message: "User created",
            user: { id: uid, ...userData },
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", verifyToken, async (req, res) => {
    try {
        const doc = await db.collection("users").doc(req.user.uid).get();

        if (!doc.exists) {
            return res.status(404).json({
                error: "User profile not found. Please sign up first.",
            });
        }

        res.json({
            user: { id: doc.id, ...doc.data() },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/me", verifyToken, async (req, res) => {
    try {
        const doc = await db.collection("users").doc(req.user.uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            user: { id: doc.id, ...doc.data() },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
});

export default router;

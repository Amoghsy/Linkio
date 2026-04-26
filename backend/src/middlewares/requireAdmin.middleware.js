import { db } from "../config/firebase.js";

/**
 * Middleware that restricts access to users with role === "admin" in Firestore.
 * Must be used AFTER verifyToken so req.user is available.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        const doc = await db.collection("users").doc(req.user.uid).get();
        if (!doc.exists || doc.data()?.role !== "admin") {
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

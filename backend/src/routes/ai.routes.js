import express from "express";
import { match, classify, trustScore, fraudDetect } from "../controllers/ai.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { geminiGenerate } from "../config/gemini.js";
import { normalizeCategory } from "../services/worker-search.utils.js";

const router = express.Router();

router.post("/match", match); // public — used in unauthenticated search
router.post("/classify", verifyToken, classify);
router.post("/trust-score", verifyToken, trustScore);
router.post("/fraud-detect", verifyToken, fraudDetect);

router.post("/normalize", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.json({ category: "" });
    }

    const prompt = `
Convert the user request into ONE service category.

Examples:
"i need plumber" → plumber
"pipe leaking" → plumber
"plum" → plumber
"carpentar" → carpenter

User input: "${query}"

Return only ONE word.
`;

    const response = await geminiGenerate(prompt);
    let category = response.toLowerCase().trim();

    if (!category) {
      category = normalizeCategory(query);
    }

    res.json({ category });

  } catch (err) {
    console.error(err);
    // fallback to manual
    const fallbackCategory = normalizeCategory(req.body?.query || "");
    res.json({ category: fallbackCategory });
  }
});

export default router;
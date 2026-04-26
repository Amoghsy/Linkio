import axios from "axios";

const GEMINI_BASE =
    "https://generativelanguage.googleapis.com/v1beta/models";

// ✅ FIXED MODEL
const MODEL = "gemini-flash-latest";

export const geminiGenerate = async (prompt, timeoutMs = 8000) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set in .env");
    }

    const response = await axios.post(
        `${GEMINI_BASE}/${MODEL}:generateContent`,
        {
            contents: [{ parts: [{ text: prompt }] }],
        },
        {
            params: { key: apiKey }, // ✅ same as curl but cleaner
            timeout: timeoutMs,
            headers: { "Content-Type": "application/json" },
        }
    );

    return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    );
};
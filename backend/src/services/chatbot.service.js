import { geminiGenerate } from "../config/gemini.js";
import { db } from "../config/firebase.js";

const SYSTEM_PROMPT = `
You are Linkio's intelligent assistant.

Linkio connects users with nearby workers:
- plumber, electrician, carpenter, cleaner, AC technician

Your job:
1. Understand user intent
2. Suggest correct service category
3. Recommend nearby workers (if provided)
4. Mention price and rating if available
5. Keep answers short, practical, and friendly

If safety/fraud → tell user to contact support@linkio.app
`;

// 🧠 simple intent detection (fast + reduces AI load)
const detectCategory = (msg) => {
    const text = msg.toLowerCase();

    if (text.includes("pipe") || text.includes("leak") || text.includes("tap")) return "plumber";
    if (text.includes("electric") || text.includes("switch") || text.includes("fan")) return "electrician";
    if (text.includes("wood") || text.includes("furniture")) return "carpenter";
    if (text.includes("clean")) return "cleaner";
    if (text.includes("ac") || text.includes("cooling")) return "ac technician";

    return null;
};

export const chatbotReply = async (message, userLocation = null) => {
    if (!message) throw new Error("message is required");

    let workersData = [];

    try {
        const category = detectCategory(message);

        // 🔥 fetch relevant workers from Firebase
        let query = db.collection("workers");

        if (category) {
            query = query.where("category", "==", category);
        }

        const snapshot = await query.limit(5).get();

        workersData = snapshot.docs.map(doc => ({
            name: doc.data().name,
            category: doc.data().category,
            rating: doc.data().rating,
            priceFrom: doc.data().priceFrom,
        }));
    } catch (err) {
        console.error("Worker fetch failed:", err.message);
    }

    // 🧠 build smart prompt
    const prompt = `
${SYSTEM_PROMPT}

User message:
"${message}"

Detected category:
${detectCategory(message) || "unknown"}

Nearby workers:
${JSON.stringify(workersData)}

Instructions:
- If workers exist → suggest them
- If no workers → suggest category
- Keep answer under 4 lines
`;

    const reply = await geminiGenerate(prompt);

    return {
        reply: reply || "Sorry, I couldn't process that. Please try again.",
    };
};
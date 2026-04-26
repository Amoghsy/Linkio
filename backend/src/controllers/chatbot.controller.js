import * as chatbotService from "../services/chatbot.service.js";

export const chat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "message is required" });
        const result = await chatbotService.chatbotReply(message);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

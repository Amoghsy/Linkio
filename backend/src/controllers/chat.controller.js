import * as chatService from "../services/chat.service.js";

export const sendMessage = async (req, res) => {
    try {
        const { chatId, text } = req.body;
        if (!chatId || !text) {
            return res.status(400).json({ error: "chatId and text are required" });
        }
        const result = await chatService.sendMessage(chatId, {
            text,
            senderId: req.user.uid,
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getChat = async (req, res) => {
    try {
        const chat = await chatService.getChat(req.params.chatId);
        if (Array.isArray(chat.participants) && chat.participants.length > 0 && !chat.participants.includes(req.user.uid)) {
            return res.status(403).json({ error: "You do not have access to this chat" });
        }
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserChats = async (req, res) => {
    try {
        if (req.params.userId !== req.user.uid) {
            return res.status(403).json({ error: "You can only view your own chats" });
        }
        const chats = await chatService.getUserChats(req.params.userId);
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

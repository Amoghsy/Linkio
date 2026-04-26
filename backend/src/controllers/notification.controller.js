import * as notificationService from "../services/notification.service.js";

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.params.userId);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const result = await notificationService.markAsRead(req.params.id);
        if (!result) return res.status(404).json({ error: "Notification not found" });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

import { db } from "../config/firebase.js";
import { admin } from "../config/firebase.js";

export const sendNotification = async (token, title, body) => {
    const message = { notification: { title, body }, token };
    await admin.messaging().send(message);
};

export const getUserNotifications = async (userId) => {
    const snap = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const markAsRead = async (id) => {
    const ref = db.collection("notifications").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update({ read: true, readAt: new Date() });
    return { id, read: true };
};

export const createNotification = async (userId, title, body, type = "general") => {
    const ref = db.collection("notifications").doc();
    const notification = {
        userId,
        title,
        body,
        type,
        read: false,
        createdAt: new Date(),
    };
    await ref.set(notification);
    return { id: ref.id, ...notification };
};
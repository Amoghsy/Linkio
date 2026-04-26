import { db } from "../config/firebase.js";

const serializeTimestamp = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") {
        return value.toDate().toISOString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value.seconds === "number") {
        return new Date(value.seconds * 1000).toISOString();
    }
    return null;
};

const serializeMessage = (doc) => {
    const data = doc.data() || {};
    return {
        id: doc.id,
        chatId: data.chatId || doc.ref.parent.parent?.id || "",
        text: data.text || "",
        senderId: data.senderId || "",
        createdAt: serializeTimestamp(data.createdAt) || new Date().toISOString(),
    };
};

const serializeChat = (doc, messages = [], fallback = {}) => {
    const data = doc?.data?.() || doc || {};

    return {
        id: doc?.id || fallback.id || "",
        jobId: data.jobId || fallback.jobId || null,
        participants: Array.isArray(data.participants) ? data.participants : fallback.participants || [],
        customerName: data.customerName || fallback.customerName || "Customer",
        workerName: data.workerName || fallback.workerName || "Worker",
        customerAvatar: data.customerAvatar || fallback.customerAvatar || "",
        workerAvatar: data.workerAvatar || fallback.workerAvatar || "",
        lastMessage: data.lastMessage || fallback.lastMessage || "",
        updatedAt: serializeTimestamp(data.updatedAt) || fallback.updatedAt || null,
        online: Boolean(data.online),
        messages,
    };
};

const getJobChatFallback = async (chatId) => {
    const jobDoc = await db.collection("jobs").doc(chatId).get();
    if (!jobDoc.exists) {
        return null;
    }

    const job = jobDoc.data() || {};
    return {
        id: chatId,
        jobId: chatId,
        participants: [job.userId, job.workerId].filter(Boolean),
        customerName: job.customerName || "Customer",
        workerName: job.workerName || "Worker",
        customerAvatar: job.customerAvatar || "",
        workerAvatar: job.workerAvatar || "",
        updatedAt: serializeTimestamp(job.updatedAt) || serializeTimestamp(job.createdAt) || null,
    };
};

export const sendMessage = async (chatId, message) => {
    const timestamp = new Date();
    const chatRef = db.collection("chats").doc(chatId);
    const [jobFallback, existingChatDoc] = await Promise.all([
        getJobChatFallback(chatId).catch(() => null),
        chatRef.get(),
    ]);

    const existingChat = existingChatDoc.exists ? existingChatDoc.data() || {} : {};
    let parsedParticipants = [];
    if (chatId.includes('_')) {
        parsedParticipants = chatId.split('_');
    }

    const participantsSource =
        (Array.isArray(existingChat.participants) && existingChat.participants.length > 0
            ? existingChat.participants
            : jobFallback?.participants) || [message.senderId];

    const participantSet = new Set([...participantsSource, ...parsedParticipants].filter(Boolean));
    participantSet.add(message.senderId);

    const messagePayload = {
        chatId,
        text: message.text,
        senderId: message.senderId,
        createdAt: timestamp,
    };

    const messageRef = await chatRef.collection("messages").add(messagePayload);

    await chatRef.set(
        {
            jobId: existingChat.jobId || jobFallback?.jobId || chatId,
            participants: Array.from(participantSet),
            customerName: existingChat.customerName || jobFallback?.customerName || "Customer",
            workerName: existingChat.workerName || jobFallback?.workerName || "Worker",
            customerAvatar: existingChat.customerAvatar || jobFallback?.customerAvatar || "",
            workerAvatar: existingChat.workerAvatar || jobFallback?.workerAvatar || "",
            lastMessage: message.text,
            updatedAt: timestamp,
        },
        { merge: true }
    );

    return {
        id: messageRef.id,
        ...messagePayload,
        createdAt: timestamp.toISOString(),
    };
};

export const getChat = async (chatId) => {
    const chatRef = db.collection("chats").doc(chatId);
    const [chatDoc, messagesSnapshot, jobFallback] = await Promise.all([
        chatRef.get(),
        chatRef.collection("messages").orderBy("createdAt", "asc").get(),
        getJobChatFallback(chatId).catch(() => null),
    ]);

    const messages = messagesSnapshot.docs.map(serializeMessage);
    if (!chatDoc.exists && !jobFallback) {
        let participants = [];
        if (chatId.includes('_')) {
            participants = chatId.split('_');
        }
        return {
            id: chatId,
            participants,
            customerName: "Customer",
            workerName: "Worker",
            lastMessage: "",
            updatedAt: null,
            messages,
        };
    }

    return serializeChat(chatDoc.exists ? chatDoc : null, messages, jobFallback || { id: chatId });
};

export const getUserChats = async (userId) => {
    const snapshot = await db
        .collection("chats")
        .where("participants", "array-contains", userId)
        .get();

    return snapshot.docs
        .map((doc) => serializeChat(doc))
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
};

import { db } from "../config/firebase.js";
import { getWorkerLatLng, normalizeLocationFields } from "./worker-search.utils.js";

export const createUser = async (data) => {
    const ref = db.collection("users").doc(data.uid);
    const userData = normalizeLocationFields(data);

    if (getWorkerLatLng(userData)) {
        userData.locationUpdatedAt = new Date();
    }

    await ref.set(userData);
    return { id: ref.id, ...userData };
};

export const getUser = async (uid) => {
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

export const updateUser = async (uid, updates) => {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const updated = { ...normalizeLocationFields(updates), updatedAt: new Date() };

    if (getWorkerLatLng(updated)) {
        updated.locationUpdatedAt = new Date();
    }

    await ref.update(updated);
    return { id: uid, ...doc.data(), ...updated };
};

export const deleteUser = async (uid) => {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.delete();
    return { id: uid };
};

import { db } from "../config/firebase.js";
import { calculateTrustScore } from "../ai/trustScore.service.js";
import { calculateDistanceKm, getWorkerLatLng } from "./worker-search.utils.js";

const getDocumentData = async (collectionName, id) => {
    if (!id) return null;
    const doc = await db.collection(collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

const refreshWorkerJobStats = async (workerId) => {
    if (!workerId) return null;

    const [workerDoc, jobsSnapshot] = await Promise.all([
        db.collection("workers").doc(workerId).get(),
        db.collection("jobs").where("workerId", "==", workerId).get(),
    ]);

    if (!workerDoc.exists) {
        return null;
    }

    const jobs = jobsSnapshot.docs.map((doc) => doc.data());
    const completedJobs = jobs.filter((job) => job.status === "completed").length;
    const cancelledJobs = jobs.filter((job) => job.status === "cancelled").length;
    const worker = workerDoc.data() || {};

    await workerDoc.ref.update({
        completedJobs,
        cancelledJobs,
        trustScore: calculateTrustScore({ ...worker, completedJobs, cancelledJobs }),
        updatedAt: new Date(),
    });

    return { completedJobs, cancelledJobs };
};

export const createJob = async (data) => {
    const ref = db.collection("jobs").doc();
    const [worker, customer] = await Promise.all([
        getDocumentData("workers", data.workerId),
        getDocumentData("users", data.userId),
    ]);
    const workerLocation = getWorkerLatLng(worker || {});
    const customerLocation = getWorkerLatLng(customer || {});
    const distanceKm =
        workerLocation && customerLocation
            ? Number(
                  calculateDistanceKm(
                      customerLocation.lat,
                      customerLocation.lng,
                      workerLocation.lat,
                      workerLocation.lng
                  ).toFixed(1)
              )
            : Number(data.distanceKm ?? 0);
    const jobData = {
        ...data,
        workerName: data.workerName || worker?.name || "Worker",
        customerName: data.customerName || customer?.name || "Customer",
        customerAvatar: data.customerAvatar || customer?.avatar || "",
        customerPhone: data.customerPhone || customer?.phone || "",
        workerLat: workerLocation?.lat ?? null,
        workerLng: workerLocation?.lng ?? null,
        customerLat: customerLocation?.lat ?? null,
        customerLng: customerLocation?.lng ?? null,
        distanceKm,
        reviewSubmitted: false,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    await ref.set(jobData);
    return { id: ref.id, ...jobData };
};

export const listJobs = async (filters = {}) => {
    let query = db.collection("jobs");
    if (filters.userId) query = query.where("userId", "==", filters.userId);
    if (filters.workerId) query = query.where("workerId", "==", filters.workerId);
    if (filters.status) query = query.where("status", "==", filters.status);
    
    // Sort in-memory to avoid needing a Firestore composite index
    const snapshot = await query.get();
    let jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Sort descending by createdAt
    jobs.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });

    return jobs.slice(0, 50);
};

export const getJob = async (id) => {
    const doc = await db.collection("jobs").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

export const updateJob = async (id, updates) => {
    const ref = db.collection("jobs").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const updated = { ...updates, updatedAt: new Date() };
    await ref.update(updated);
    return { id, ...doc.data(), ...updated };
};

export const updateJobStatus = async (id, status) => {
    const ref = db.collection("jobs").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const current = doc.data() || {};
    const worker = current.workerId
        ? await getDocumentData("workers", current.workerId)
        : null;
    const workerLocation = getWorkerLatLng(worker || {});
    const updated = {
        status,
        updatedAt: new Date(),
        ...(workerLocation
            ? { workerLat: workerLocation.lat, workerLng: workerLocation.lng }
            : {}),
    };
    await ref.update(updated);

    if (current.workerId) {
        await refreshWorkerJobStats(current.workerId);
    }

    return { id, ...current, ...updated };
};

export const deleteJob = async (id) => {
    const ref = db.collection("jobs").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.delete();
    return { id };
};

import { db } from "../config/firebase.js";

export const getAdminUsers = async () => {
    const snap = await db.collection("users").orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAdminWorkers = async () => {
    const snap = await db.collection("workers").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAdminJobs = async () => {
    const snap = await db.collection("jobs").orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const verifyWorker = async (id, data = {}) => {
    const ref = db.collection("workers").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    
    const updateData = { 
        verified: true, 
        priceApproved: true, 
        verifiedAt: new Date() 
    };
    
    if (data.priceFrom !== undefined) updateData.priceFrom = Number(data.priceFrom);
    if (data.priceTo !== undefined) updateData.priceTo = Number(data.priceTo);
    
    await ref.update(updateData);
    return { id, ...updateData };
};

export const updateWorkerFare = async (id, priceFrom, priceTo) => {
    const ref = db.collection("workers").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    
    const updateData = { 
        priceFrom: Number(priceFrom), 
        priceTo: Number(priceTo),
        priceApproved: true 
    };
    
    await ref.update(updateData);
    return { id, ...updateData };
};

export const deleteWorker = async (id) => {
    const workerRef = db.collection("workers").doc(id);
    const workerDoc = await workerRef.get();
    if (!workerDoc.exists) return false;
    
    await workerRef.delete();
    
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        await userRef.delete();
    }
    
    return true;
};

export const getStats = async () => {
    const [usersSnap, jobsSnap, workersSnap, paymentsSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("jobs").get(),
        db.collection("workers").get(),
        db.collection("payments").get(),
    ]);

    const completedJobs = jobsSnap.docs.filter((d) => d.data().status === "completed").length;
    const pendingJobs = jobsSnap.docs.filter((d) => d.data().status === "pending").length;
    const totalRevenue = paymentsSnap.docs
        .filter((d) => d.data().status === "completed")
        .reduce((sum, d) => sum + (d.data().amount || 0), 0);

    const pendingVerifications = workersSnap.docs.filter((d) => !d.data().verified).length;

    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: d.getMonth(),
            jobs: 0,
            signups: 0
        });
    }

    jobsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const entry = last6Months.find(m => m.monthNum === date.getMonth() && m.year === date.getFullYear());
            if (entry) entry.jobs++;
        }
    });

    workersSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const entry = last6Months.find(m => m.monthNum === date.getMonth() && m.year === date.getFullYear());
            if (entry) entry.signups++;
        }
    });

    return {
        totalUsers: usersSnap.size,
        totalWorkers: workersSnap.size,
        totalJobs: jobsSnap.size,
        completedJobs,
        pendingJobs,
        totalRevenue,
        pendingVerifications,
        monthly: last6Months.map(m => ({ month: m.month, jobs: m.jobs, signups: m.signups }))
    };
};
import { db } from "../config/firebase.js";

export const getOverview = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [usersSnap, workersSnap, jobsSnap, paymentsSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("workers").get(),
        db.collection("jobs").get(),
        db.collection("payments").where("status", "==", "completed").get(),
    ]);

    const recentJobs = jobsSnap.docs.filter(
        (d) => d.data().createdAt?.toDate?.() > thirtyDaysAgo
    ).length;

    const totalRevenue = paymentsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

    return {
        totalUsers: usersSnap.size,
        totalWorkers: workersSnap.size,
        totalJobs: jobsSnap.size,
        recentJobs,
        totalRevenue,
        currency: "INR",
    };
};

export const getDemand = async () => {
    const snap = await db.collection("jobs").get();
    const categoryCount = {};

    snap.docs.forEach((doc) => {
        const cat = doc.data().category || "other";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const demand = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

    return { demand, totalJobs: snap.size };
};

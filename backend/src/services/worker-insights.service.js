import { db } from "../config/firebase.js";
import { calculateTrustScore } from "../ai/trustScore.service.js";
import { generateTrainingInsights } from "../ai/training.service.js";

export const refreshWorkerInsights = async (workerId) => {
    if (!workerId) return null;

    const workerRef = db.collection("workers").doc(workerId);
    const [workerSnap, reviewsSnap, jobsSnap] = await Promise.all([
        workerRef.get(),
        db.collection("reviews").where("workerId", "==", workerId).get(),
        db.collection("jobs").where("workerId", "==", workerId).get(),
    ]);

    if (!workerSnap.exists) {
        return null;
    }

    const worker = workerSnap.data() || {};
    const reviews = reviewsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const rating =
        reviews.length > 0
            ? Number(
                  (
                      reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) /
                      reviews.length
                  ).toFixed(2)
              )
            : 0;
    const jobs = jobsSnap.docs.map((doc) => doc.data());
    const completedJobs = jobs.filter((job) => job.status === "completed").length;
    const cancelledJobs = jobs.filter((job) => job.status === "cancelled").length;
    const training = await generateTrainingInsights({
        worker: {
            id: workerId,
            ...worker,
            rating,
            completedJobs,
            cancelledJobs,
            reviewsCount: reviews.length,
        },
        reviews,
    });

    const nextWorker = {
        rating,
        reviewsCount: reviews.length,
        completedJobs,
        cancelledJobs,
        feedbackSummary: training.summary,
        trainingRecommendations: training.recommendations,
        feedbackUpdatedAt: new Date(),
        trustScore: calculateTrustScore({
            ...worker,
            rating,
            completedJobs,
            cancelledJobs,
        }),
        updatedAt: new Date(),
    };

    await workerRef.update(nextWorker);

    return {
        worker: { id: workerId, ...worker, ...nextWorker },
        reviews,
    };
};

export const getWorkerInsightsSnapshot = async (workerId) => {
    const refreshed = await refreshWorkerInsights(workerId);
    if (!refreshed) {
        return null;
    }

    return {
        workerId,
        summary: refreshed.worker.feedbackSummary || "",
        recommendations: Array.isArray(refreshed.worker.trainingRecommendations)
            ? refreshed.worker.trainingRecommendations
            : [],
        updatedAt: refreshed.worker.feedbackUpdatedAt || refreshed.worker.updatedAt || null,
        feedbackCount: refreshed.reviews.length,
        basedOnFeedback: refreshed.reviews.length > 0,
    };
};

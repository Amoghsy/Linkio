import { db } from "../config/firebase.js";
import { refreshWorkerInsights } from "./worker-insights.service.js";

export const createReview = async (data) => {
    const { workerId, userId, jobId, rating, comment } = data;
    if (!workerId || !userId || !jobId || rating === undefined) {
        throw new Error("workerId, userId, jobId, and rating are required");
    }
    if (rating < 1 || rating > 5) throw new Error("rating must be between 1 and 5");

    const [jobSnap, userSnap] = await Promise.all([
        db.collection("jobs").doc(jobId).get(),
        db.collection("users").doc(userId).get(),
    ]);

    if (!jobSnap.exists) {
        throw new Error("Job not found");
    }

    const job = jobSnap.data() || {};
    if (job.userId !== userId || job.workerId !== workerId) {
        throw new Error("You can only review your own completed job");
    }
    if (job.status !== "completed") {
        throw new Error("Review can only be submitted after the job is completed");
    }

    const customerName = userSnap.exists ? userSnap.data()?.name || "Customer" : "Customer";
    const existingReviewSnap = await db
        .collection("reviews")
        .where("jobId", "==", jobId)
        .limit(1)
        .get();

    const payload = {
        workerId,
        userId,
        jobId,
        customerName,
        rating: Number(rating),
        comment: comment || "",
        category: job.category || "",
        updatedAt: new Date(),
    };

    let reviewRef;
    let createdAt = new Date();

    if (!existingReviewSnap.empty) {
        reviewRef = existingReviewSnap.docs[0].ref;
        createdAt = existingReviewSnap.docs[0].data()?.createdAt || createdAt;
        await reviewRef.update(payload);
    } else {
        reviewRef = db.collection("reviews").doc();
        await reviewRef.set({
            ...payload,
            createdAt,
        });
    }

    await jobSnap.ref.update({
        reviewSubmitted: true,
        reviewId: reviewRef.id,
        updatedAt: new Date(),
    });

    await refreshWorkerInsights(workerId);

    return { id: reviewRef.id, ...payload, createdAt };
};

export const getWorkerReviews = async (workerId) => {
    const snap = await db
        .collection("reviews")
        .where("workerId", "==", workerId)
        .get();
    
    const reviews = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory to avoid requiring a composite index in Firestore
    return reviews.sort((a, b) => {
        try {
            let timeA = 0;
            let timeB = 0;
            
            if (a.createdAt) {
                timeA = typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
            }
            if (b.createdAt) {
                timeB = typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
            }
            
            if (isNaN(timeA)) timeA = 0;
            if (isNaN(timeB)) timeB = 0;
            
            return timeB - timeA;
        } catch (e) {
            return 0;
        }
    });
};

export const deleteReview = async (id) => {
    const ref = db.collection("reviews").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const review = doc.data() || {};
    await ref.delete();
    if (review.jobId) {
        await db.collection("jobs").doc(review.jobId).update({
            reviewSubmitted: false,
            reviewId: null,
            updatedAt: new Date(),
        });
    }
    if (review.workerId) {
        await refreshWorkerInsights(review.workerId);
    }
    return { id };
};

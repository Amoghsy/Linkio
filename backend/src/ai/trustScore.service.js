export const calculateTrustScore = (worker) => {
    const {
        rating = 0,
        completedJobs = 0,
        cancelledJobs = 0,
    } = worker;

    let score = 0;

    score += rating * 20; // max 100
    score += completedJobs * 0.5;
    score -= cancelledJobs * 2;

    return Math.max(0, Math.min(100, score));
};
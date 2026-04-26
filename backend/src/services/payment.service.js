import { db } from "../config/firebase.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "your_key_id" || !process.env.RAZORPAY_KEY_SECRET) {
        return null;
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const createPayment = async (jobId, amount) => {
    if (!jobId || !amount) throw new Error("jobId and amount are required");
    
    let razorpayOrderId = null;
    const razorpay = getRazorpayInstance();

    if (razorpay) {
        try {
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100), // amount in paise
                currency: "INR",
                receipt: jobId,
            });
            razorpayOrderId = order.id;
        } catch (error) {
            console.error("Razorpay Order Creation Failed:", error);
            // We can continue to save payment intent even if razorpay fails, 
            // or we could throw an error. For robust systems, throw:
            throw new Error("Failed to create payment order with gateway");
        }
    }

    const ref = db.collection("payments").doc();
    await ref.set({ 
        jobId, 
        amount, 
        status: "pending", 
        razorpayOrderId,
        createdAt: new Date() 
    });
    
    return { 
        paymentId: ref.id, 
        jobId, 
        amount, 
        razorpayOrderId,
        currency: "INR" 
    };
};

export const verifyPayment = async (paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature) => {
    const ref = db.collection("payments").doc(paymentId);
    const doc = await ref.get();
    if (!doc.exists) throw new Error("Payment not found");
    if (doc.data().status === "completed") throw new Error("Payment already completed");

    // Verify signature if provided and if we have a secret configured
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret && secret !== "your_key_secret") {
            const generated_signature = crypto
                .createHmac("sha256", secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (generated_signature !== razorpay_signature) {
                throw new Error("Invalid payment signature");
            }
        }
    }

    await ref.update({ 
        status: "completed", 
        razorpay_payment_id: razorpay_payment_id || null,
        completedAt: new Date() 
    });
    
    // Also update the job status if it's tied to payment
    const paymentData = doc.data();
    if (paymentData.jobId) {
        await db.collection("jobs").doc(paymentData.jobId).update({
            paymentStatus: "completed"
        });
    }

    return { success: true, paymentId };
};

export const getUserPayments = async (userId) => {
    const snapshot = await db
        .collection("payments")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
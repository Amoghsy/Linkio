import * as paymentService from "../services/payment.service.js";

export const createPayment = async (req, res) => {
    try {
        const { jobId, amount } = req.body;
        const payment = await paymentService.createPayment(jobId, amount);
        res.status(201).json(payment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        if (!paymentId) return res.status(400).json({ error: "paymentId is required" });
        const result = await paymentService.verifyPayment(
            paymentId, 
            razorpay_payment_id, 
            razorpay_order_id, 
            razorpay_signature
        );
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getConfig = async (req, res) => {
    console.log("[getConfig] RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
    res.json({
        key: process.env.RAZORPAY_KEY_ID || "your_key_id"
    });
};

export const getUserPayments = async (req, res) => {
    try {
        const payments = await paymentService.getUserPayments(req.params.userId);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
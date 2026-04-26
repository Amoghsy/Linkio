import { db } from "../config/firebase.js";
import * as jobService from "../services/job.service.js";

const VALID_STATUSES = ["pending", "accepted", "ongoing", "in_progress", "completed", "cancelled"];

export const createJob = async (req, res) => {
    try {
        const { workerId } = req.body;
        if (!workerId) {
            return res.status(400).json({ error: "workerId is required" });
        }
        const job = await jobService.createJob({ ...req.body, userId: req.user.uid });
        res.status(201).json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const listJobs = async (req, res) => {
    try {
        const { userId, workerId, status } = req.query;
        const jobs = await jobService.listJobs({ userId, workerId, status });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getJob = async (req, res) => {
    try {
        const job = await jobService.getJob(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateJob = async (req, res) => {
    try {
        const job = await jobService.updateJob(req.params.id, req.body);
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            });
        }
        const job = await jobService.updateJobStatus(id, status);
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json({ success: true, ...job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const result = await jobService.deleteJob(req.params.id);
        if (!result) return res.status(404).json({ error: "Job not found" });
        res.json({ message: "Job deleted", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

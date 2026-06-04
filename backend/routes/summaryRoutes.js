import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import ConversationSummaryService from "../services/summaryService.js";

const router = express.Router();

// @route   GET /api/summaries
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { limit, platform } = req.query;
    const summaries = await ConversationSummaryService.getSummaries(company._id, {
      limit: parseInt(limit) || 20,
      platform,
    });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/summaries/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const stats = await ConversationSummaryService.getSummaryStats(company._id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/summaries/generate/:userId/:platform
router.post("/generate/:userId/:platform", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const CompanyChat = (await import("../models/CompanyChat.js")).default;
    const messages = await CompanyChat.Model.find({
      company: company._id,
      user: req.params.userId,
      platform: req.params.platform,
    }).sort({ createdAt: 1 }).lean();

    const summary = await ConversationSummaryService.generateSummary(
      company._id,
      req.params.userId,
      req.params.platform,
      messages
    );

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

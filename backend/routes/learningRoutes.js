import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import AILearningService from "../services/aiLearningService.js";

const router = express.Router();

// @route   GET /api/learning/patterns
// @desc    Get all learning patterns for the company
router.get("/patterns", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const patterns = await AILearningService.getPatterns(company._id);
    res.json(patterns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/learning/patterns
// @desc    Manually add a learning pattern
router.post("/patterns", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { userMessage, agentReply, platform } = req.body;
    if (!userMessage || !agentReply) {
      return res.status(400).json({ error: "userMessage and agentReply are required" });
    }

    const pattern = await AILearningService.addPattern(
      company._id,
      userMessage,
      agentReply,
      platform || "manual"
    );

    res.json({ success: true, pattern });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/learning/patterns/:id
// @desc    Delete a learning pattern
router.delete("/patterns/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const deleted = await AILearningService.deletePattern(req.params.id, company._id);
    if (!deleted) return res.status(404).json({ error: "Pattern not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

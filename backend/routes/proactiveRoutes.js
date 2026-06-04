import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import ProactiveMessagingService from "../services/proactiveService.js";

const router = express.Router();

// @route   GET /api/proactive/rules
router.get("/rules", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const rules = await ProactiveMessagingService.getRules(company._id);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/proactive/rules
router.post("/rules", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const rule = await ProactiveMessagingService.createRule(company._id, req.body);
    if (!rule) return res.status(500).json({ error: "Failed to create rule" });
    res.json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/proactive/rules/:id
router.patch("/rules/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const rule = await ProactiveMessagingService.updateRule(req.params.id, company._id, req.body);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/proactive/rules/:id
router.delete("/rules/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const deleted = await ProactiveMessagingService.deleteRule(req.params.id, company._id);
    if (!deleted) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/proactive/rules/:id/toggle
router.patch("/rules/:id/toggle", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const rule = await ProactiveMessagingService.toggleRule(req.params.id, company._id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

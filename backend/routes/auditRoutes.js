import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import AuditService from "../services/auditService.js";

const router = express.Router();

// @route   GET /api/audit
// @desc    Get audit logs for the company
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { limit, offset, action, from, to } = req.query;
    const logs = await AuditService.getLogs(company._id, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      action,
      from,
      to,
    });

    const total = await AuditService.getLogCount(company._id, action);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/audit/stats
// @desc    Get audit stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const total = await AuditService.getLogCount(company._id);
    const integrationChanges = await AuditService.getLogCount(company._id, "integration_change");
    const settingChanges = await AuditService.getLogCount(company._id, "setting_change");
    const aiChanges = await AuditService.getLogCount(company._id, "ai_config_change");

    res.json({ total, integrationChanges, settingChanges, aiChanges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

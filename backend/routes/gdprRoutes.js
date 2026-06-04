import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import GDPRService from "../services/gdprService.js";

const router = express.Router();

// @route   GET /api/gdpr/export
// @desc    Export all user data (GDPR right to data portability)
router.get("/export", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await GDPRService.exportUserData(company._id);
    res.setHeader("Content-Disposition", "attachment; filename=voxio-data-export.json");
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/gdpr/delete
// @desc    Request deletion of all user data (GDPR right to erasure)
router.post("/delete", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { confirm } = req.body;
    if (confirm !== "DELETE_MY_DATA") {
      return res.status(400).json({
        error: 'Please send confirm: "DELETE_MY_DATA" to proceed',
      });
    }

    await GDPRService.deleteUserData(company._id);
    res.json({ success: true, message: "All data has been permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/gdpr/anonymize
// @desc    Anonymize conversation data
router.post("/anonymize", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const result = await GDPRService.anonymizeConversations(company._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

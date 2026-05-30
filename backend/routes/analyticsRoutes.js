import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import AnalyticsService from "../services/analyticsService.js";

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics overview
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getDashboardAnalytics(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/timeseries
// @desc    Get message/conversation time series
router.get("/timeseries", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsService.getTimeSeriesData(company._id, days);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/platforms
// @desc    Get platform distribution
router.get("/platforms", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getPlatformDistribution(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/hourly
// @desc    Get hourly heatmap data
router.get("/hourly", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getHourlyHeatmap(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/response-time
// @desc    Get AI response time analysis
router.get("/response-time", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getResponseTimeAnalysis(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/leads
// @desc    Get lead analytics
router.get("/leads", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getLeadAnalytics(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/analytics/comprehensive
// @desc    Get comprehensive analytics report
router.get("/comprehensive", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const data = await AnalyticsService.getComprehensiveReport(company._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

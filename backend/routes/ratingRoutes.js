import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import ChatRating from "../models/ChatRating.js";

const router = express.Router();

// @route   POST /api/ratings
// @desc    Submit a rating for a conversation
router.post("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { userId, platform, rating, feedback } = req.body;
    if (!userId || !platform || !rating) {
      return res.status(400).json({ error: "userId, platform, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const existing = await ChatRating.Model.findOne({
      company: company._id,
      userId,
      platform,
    }).lean();

    if (existing) {
      await ChatRating.Model.findOneAndUpdate(
        { _id: existing._id },
        { $set: { rating, feedback: feedback || existing.feedback } }
      );
    } else {
      await ChatRating.create({
        company: company._id,
        userId,
        platform,
        rating,
        feedback: feedback || "",
      });
    }

    res.json({ success: true, message: "Rating submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/ratings/stats
// @desc    Get rating statistics for the company
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const ratings = await ChatRating.Model.find({ company: company._id }).lean();

    if (!ratings.length) {
      return res.json({
        avgRating: 0,
        totalRatings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }

    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach((r) => {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[bucket]++;
    });

    res.json({
      avgRating: Math.round((sum / total) * 10) / 10,
      totalRatings: total,
      distribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/ratings
// @desc    Get all ratings for the company
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const ratings = await ChatRating.Model.find({ company: company._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

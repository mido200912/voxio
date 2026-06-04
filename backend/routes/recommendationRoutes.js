import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import ProductRecommendationService from "../services/recommendationService.js";

const router = express.Router();

// @route   GET /api/recommendations/search
router.get("/search", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { q, limit } = req.query;
    const products = await ProductRecommendationService.getRecommendations(
      company._id,
      q || "",
      parseInt(limit) || 3
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/recommendations/popular
router.get("/popular", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { limit } = req.query;
    const products = await ProductRecommendationService.getPopularProducts(
      company._id,
      parseInt(limit) || 5
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/recommendations/category/:category
router.get("/category/:category", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const products = await ProductRecommendationService.getProductsInCategory(
      company._id,
      req.params.category
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

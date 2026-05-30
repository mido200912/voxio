import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import Product from "../models/Product.js";

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products for company
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const products = await Product.find({ company: company._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/products/platform/:platform
// @desc    Get products filtered by platform
router.get("/platform/:platform", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const products = await Product.find({
      company: company._id,
      platforms: req.params.platform,
      isActive: true
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/products
// @desc    Create a new product
router.post("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { name, description, price, currency, images, category, sku, inventory, platforms } = req.body;
    if (!name) return res.status(400).json({ error: "Product name is required" });

    const product = await Product.create({
      company: company._id,
      name, description, price, currency, images, category, sku, inventory, platforms,
      isActive: true
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.company !== company._id) return res.status(403).json({ error: "Unauthorized" });

    const { name, description, price, currency, images, category, sku, inventory, isActive, platforms } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (currency !== undefined) product.currency = currency;
    if (images !== undefined) product.images = images;
    if (category !== undefined) product.category = category;
    if (sku !== undefined) product.sku = sku;
    if (inventory !== undefined) product.inventory = inventory;
    if (isActive !== undefined) product.isActive = isActive;
    if (platforms !== undefined) product.platforms = platforms;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.company !== company._id) return res.status(403).json({ error: "Unauthorized" });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/products/sync-from-integration/:platform
// @desc    Sync products from an integration (Shopify, etc.)
router.post("/sync-from-integration/:platform", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const Integration = (await import("../models/Integration.js")).default;
    const integration = await Integration.findOne({ company: company._id, platform: req.params.platform });
    if (!integration) return res.status(404).json({ error: "Integration not found" });

    let importedProducts = [];

    if (req.params.platform === "shopify") {
      const { shopUrl, accessToken } = integration.credentials || {};
      if (!shopUrl || !accessToken) {
        return res.status(400).json({ error: "Shopify credentials missing" });
      }

      const axios = (await import("axios")).default;
      let url = `https://${shopUrl}/admin/api/2024-01/products.json?limit=250`;
      while (url) {
        const { data } = await axios.get(url, {
          headers: { "X-Shopify-Access-Token": accessToken }
        });
        for (const sp of data.products) {
          const existing = await Product.findOne({ company: company._id, sku: sp.variants?.[0]?.sku || `shopify_${sp.id}` });
          if (!existing) {
            await Product.create({
              company: company._id,
              name: sp.title,
              description: sp.body_html?.replace(/<[^>]*>/g, "") || "",
              price: parseFloat(sp.variants?.[0]?.price || 0),
              currency: "USD",
              images: sp.images?.map(i => i.src) || [],
              category: sp.product_type || "",
              sku: sp.variants?.[0]?.sku || `shopify_${sp.id}`,
              inventory: sp.variants?.[0]?.inventory_quantity || 0,
              platforms: ["shopify"],
              metadata: { shopifyId: sp.id }
            });
          } else {
            existing.name = sp.title;
            existing.description = sp.body_html?.replace(/<[^>]*>/g, "") || "";
            existing.price = parseFloat(sp.variants?.[0]?.price || 0);
            existing.images = sp.images?.map(i => i.src) || [];
            existing.inventory = sp.variants?.[0]?.inventory_quantity || 0;
            await existing.save();
          }
          importedProducts.push(sp.title);
        }
        url = null;
      }
    }

    res.json({ message: `Synced ${importedProducts.length} products from ${req.params.platform}`, count: importedProducts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

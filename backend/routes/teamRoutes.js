import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import TeamMember from "../models/TeamMember.js";

const router = express.Router();

// @route   GET /api/team
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const members = await TeamMember.Model.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/team
router.post("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const validRoles = ["admin", "manager", "agent", "viewer"];
    const memberRole = validRoles.includes(role) ? role : "agent";

    const existing = await TeamMember.Model.findOne({
      company: company._id,
      email,
    }).lean();
    if (existing) {
      return res.status(400).json({ error: "Member already exists" });
    }

    const member = await TeamMember.create({
      company: company._id,
      name,
      email,
      role: memberRole,
      addedBy: req.user._id,
    });

    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/team/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { role, isActive, name } = req.body;
    const update = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    if (name) update.name = name;

    const member = await TeamMember.Model.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { $set: update },
      { new: true }
    );

    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/team/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    await TeamMember.Model.findOneAndDelete({
      _id: req.params.id,
      company: company._id,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/team/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const members = await TeamMember.Model.find({ company: company._id }).lean();
    const total = members.length;
    const active = members.filter((m) => m.isActive).length;
    const roleBreakdown = {};
    members.forEach((m) => {
      roleBreakdown[m.role] = (roleBreakdown[m.role] || 0) + 1;
    });

    res.json({ total, active, roleBreakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

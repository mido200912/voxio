import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new appointment (can be called by AI or customer)
router.post("/", async (req, res) => {
  try {
    const { companyId, userId, platform, customerName, customerPhone, customerEmail, date, time, service, notes } = req.body;
    if (!companyId || !customerName || !date || !time) {
      return res.status(400).json({ error: "companyId, customerName, date, and time are required" });
    }

    const appointment = await Appointment.create({
      company: companyId,
      userId: userId || "unknown",
      platform: platform || "widget",
      customerName,
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      date,
      time,
      service: service || "",
      notes: notes || "",
      status: "pending",
    });

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/bookings
// @desc    Get all appointments for the company
router.get("/", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { status, from, to } = req.query;
    const query = { company: company._id };
    if (status) query.status = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const appointments = await Appointment.Model.find(query)
      .sort({ date: 1, time: 1 })
      .limit(200)
      .lean();

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/bookings/:id
// @desc    Update appointment status
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;

    const appointment = await Appointment.Model.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { $set: update },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete an appointment
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    await Appointment.Model.findOneAndDelete({
      _id: req.params.id,
      company: company._id,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/bookings/available
// @desc    Check available slots for a specific date
router.get("/available", async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId || !date) {
      return res.status(400).json({ error: "companyId and date are required" });
    }

    const booked = await Appointment.Model.find({
      company: companyId,
      date,
      status: { $in: ["pending", "confirmed"] },
    })
      .select("time")
      .lean();

    const bookedTimes = booked.map((b) => b.time);

    const allSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    ];

    const available = allSlots.filter((slot) => !bookedTimes.includes(slot));

    res.json({ date, available, booked: bookedTimes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

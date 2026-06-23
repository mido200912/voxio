import express from "express";
import { requireAuth } from "../middleware/auth.js";
import NotificationService from "../services/notificationService.js";
import NotificationSettings from "../models/NotificationSettings.js";

const router = express.Router();

// @route   POST /api/notifications/fcm-token
// @desc    Save Firebase Cloud Messaging token for push notifications
router.post("/fcm-token", requireAuth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: "FCM token is required" });

    await NotificationService.saveFcmToken(req.user._id, fcmToken);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/notifications/fcm-token
// @desc    Remove FCM token (user logged out)
router.delete("/fcm-token", requireAuth, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user._id);
    if (user) {
      user.fcmToken = null;
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/notifications/settings
// @desc    Get user notification settings
router.get("/settings", requireAuth, async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await NotificationSettings.create({ user: req.user._id });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/notifications/settings
// @desc    Update user notification settings
router.put("/settings", requireAuth, async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await NotificationSettings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await NotificationSettings.create({ user: req.user._id, ...updateData });
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/notifications/mute
// @desc    Mute or unmute all notifications
router.post("/mute", requireAuth, async (req, res) => {
  try {
    const { mute } = req.body;
    let settings = await NotificationSettings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await NotificationSettings.create({ user: req.user._id, enabled: !mute });
    } else {
      settings.enabled = !mute;
      await settings.save();
    }

    res.json({ success: true, enabled: settings.enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/notifications/test
// @desc    Send a test push notification
router.post("/test", requireAuth, async (req, res) => {
  try {
    await NotificationService.sendPushNotification(
      req.user._id,
      "🔔 إشعار تجريبي من VOXIO",
      "هذا إشعار تجريبي للتحقق من عمل الإشعارات بشكل صحيح",
      { type: "test" }
    );
    res.json({ success: true, message: "Test notification sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

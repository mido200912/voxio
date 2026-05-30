import express from "express";
import { requireAuth } from "../middleware/auth.js";
import NotificationService from "../services/notificationService.js";

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

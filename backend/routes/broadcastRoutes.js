import express from "express";
import { FirestoreModel } from "../config/firestoreModel.js";

const router = express.Router();
const SystemSettings = new FirestoreModel("SystemSettings");

/**
 * 📢 Get current active system broadcast
 */
router.get("/current", async (req, res) => {
  try {
    const broadcast = await SystemSettings.findOne({ _id: "broadcast" });
    
    if (!broadcast) {
      return res.json({ success: true, broadcast: null });
    }
    
    // Check if it's still active (optional: could add expiration logic)
    if (broadcast.active === false) {
      return res.json({ success: true, broadcast: null });
    }

    res.json({ success: true, broadcast });
  } catch (error) {
    console.error("Fetch broadcast error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;

import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Master enable/disable
    enabled: {
      type: Boolean,
      default: true,
    },

    // Per-type toggles
    newMessage: { type: Boolean, default: true },
    aiReply: { type: Boolean, default: true },
    newOrder: { type: Boolean, default: true },
    humanHandoff: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: false },
    broadcast: { type: Boolean, default: true },

    // Per-platform toggles
    platforms: {
      whatsapp: { type: Boolean, default: true },
      instagram: { type: Boolean, default: true },
      telegram: { type: Boolean, default: true },
      web: { type: Boolean, default: true },
      widget: { type: Boolean, default: true },
      messenger: { type: Boolean, default: true },
    },

    // Do Not Disturb
    dndEnabled: { type: Boolean, default: false },
    dndFrom: { type: String, default: "22:00" },
    dndTo: { type: String, default: "07:00" },

    // Sound & Vibration
    sound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast lookup
notificationSettingsSchema.index({ user: 1 });

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);

export default NotificationSettings;

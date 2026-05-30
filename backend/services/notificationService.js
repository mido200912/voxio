import Company from "../models/CompanyModel.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

class NotificationService {
  static async sendPushNotification(userId, title, body, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) return;

      const { default: admin } = await import("firebase-admin");
      const message = {
        token: user.fcmToken,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: { priority: "high", notification: { channelId: "voxio_default", sound: "default" } },
        apns: { payload: { aps: { sound: "default", badge: 1 } } },
      };

      await admin.messaging().send(message);
      console.log(`[Push] Notification sent to user ${userId}: ${title}`);
    } catch (err) {
      console.error("[Push] Error sending notification:", err.message);
    }
  }

  static async notifyNewMessage(companyId, customerName, platform, messagePreview) {
    try {
      const company = await Company.findById(companyId);
      if (!company) return;

      const ownerId = company.owner;
      const title = `💬 رسالة جديدة من ${customerName || "عميل"}`;
      const body = `${platform}: ${(messagePreview || "").substring(0, 80)}`;

      await NotificationService.sendPushNotification(ownerId, title, body, {
        type: "new_message",
        companyId: companyId.toString(),
        platform,
        customerName: customerName || "",
      });

      await NotificationService.sendEmailNotification(ownerId, title, body);

      const orders = company.requests || [];
      const totalOrders = orders.length;
      console.log(`[Notify] Message notification sent (platform: ${platform}, total orders: ${totalOrders})`);
    } catch (err) {
      console.error("[Notify] newMessage error:", err.message);
    }
  }

  static async notifyAiReply(companyId, customerName, platform) {
    try {
      const title = `🤖 تم الرد تلقائياً على ${customerName || "عميل"}`;
      const body = `الذكاء الاصطناعي رد على رسالة من ${platform}`;

      const company = await Company.findById(companyId);
      if (!company) return;

      await NotificationService.sendPushNotification(company.owner, title, body, {
        type: "ai_reply",
        companyId: companyId.toString(),
        platform,
        customerName: customerName || "",
      });
    } catch (err) {
      console.error("[Notify] aiReply error:", err.message);
    }
  }

  static async notifyNewOrder(companyId, orderData) {
    try {
      const company = await Company.findById(companyId);
      if (!company) return;

      const title = `🛒 طلب جديد!`;
      const body = `طلب جديد بقيمة ${orderData.totalPrice || 0} من ${orderData.customerName || "عميل"}`;

      await NotificationService.sendPushNotification(company.owner, title, body, {
        type: "new_order",
        companyId: companyId.toString(),
        orderId: orderData.orderId || orderData._id?.toString() || "",
        totalPrice: String(orderData.totalPrice || 0),
        customerName: orderData.customerName || "",
      });

      await NotificationService.sendEmailNotification(
        company.owner,
        title,
        `التفاصيل:\nالعميل: ${orderData.customerName || "غير معروف"}\nالقيمة: ${orderData.totalPrice || 0}\nالمنتج: ${orderData.items?.map(i => i.name).join(", ") || "غير محدد"}`
      );
    } catch (err) {
      console.error("[Notify] newOrder error:", err.message);
    }
  }

  static async notifyHumanHandoff(companyId, customerName, platform) {
    try {
      const company = await Company.findById(companyId);
      if (!company) return;

      const title = `👤 تحويل بشري مطلوب`;
      const body = `${customerName || "عميل"} يطلب التحدث مع موظف عبر ${platform}`;

      await NotificationService.sendPushNotification(company.owner, title, body, {
        type: "human_handoff",
        companyId: companyId.toString(),
        platform,
        customerName: customerName || "",
      });
    } catch (err) {
      console.error("[Notify] handoff error:", err.message);
    }
  }

  static async sendEmailNotification(userId, subject, message) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      await sendEmail({
        email: user.email,
        subject: `[VOXIO] ${subject}`,
        message,
        html: `<div dir="rtl"><h2>${subject}</h2><p>${message}</p><hr/><small>منصة VOXIO</small></div>`,
      });
    } catch (err) {
      console.error("[Email] Error sending notification:", err.message);
    }
  }

  static async broadcastToCompany(companyId, title, body, type = "info") {
    try {
      const company = await Company.findById(companyId);
      if (!company) return;

      await NotificationService.sendPushNotification(company.owner, title, body, {
        type: "broadcast",
        broadcastType: type,
        companyId: companyId.toString(),
      });
    } catch (err) {
      console.error("[Broadcast] Error:", err.message);
    }
  }

  static async saveFcmToken(userId, fcmToken) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      user.fcmToken = fcmToken;
      await user.save();
      console.log(`[Push] FCM token saved for user ${userId}`);
    } catch (err) {
      console.error("[Push] Error saving FCM token:", err.message);
    }
  }
}

export default NotificationService;

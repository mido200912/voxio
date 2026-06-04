import Company from "../models/CompanyModel.js";
import CompanyChat from "../models/CompanyChat.js";
import ChatRating from "../models/ChatRating.js";
import Appointment from "../models/Appointment.js";
import AuditLog from "../models/AuditLog.js";
import Integration from "../models/Integration.js";

class GDPRService {
  static async exportUserData(companyId) {
    try {
      const company = await Company.findById(companyId).lean();
      const chats = await CompanyChat.Model.find({ company: companyId }).lean();
      const ratings = await ChatRating.Model.find({ company: companyId }).lean();
      const appointments = await Appointment.Model.find({ company: companyId }).lean();
      const integrations = await Integration.find({ company: companyId })
        .select("-credentials.accessToken -credentials.botToken")
        .lean();

      return {
        exportDate: new Date().toISOString(),
        company: {
          name: company?.companyName,
          email: company?.email,
          createdAt: company?.createdAt,
        },
        statistics: {
          totalConversations: chats.length,
          totalRatings: ratings.length,
          totalAppointments: appointments.length,
          connectedPlatforms: integrations.map((i) => i.platform),
        },
        conversations: chats.map((c) => ({
          user: c.user,
          platform: c.platform,
          text: c.text,
          sender: c.sender,
          createdAt: c.createdAt,
        })),
        ratings: ratings.map((r) => ({
          userId: r.userId,
          platform: r.platform,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt,
        })),
        appointments: appointments.map((a) => ({
          customerName: a.customerName,
          date: a.date,
          time: a.time,
          service: a.service,
          status: a.status,
        })),
      };
    } catch (err) {
      console.error("[GDPR] Error exporting data:", err.message);
      throw err;
    }
  }

  static async deleteUserData(companyId) {
    try {
      console.log(`[GDPR] Starting data deletion for company: ${companyId}`);

      await CompanyChat.Model.deleteMany({ company: companyId });
      console.log(`[GDPR] Deleted all conversations`);

      await ChatRating.Model.deleteMany({ company: companyId });
      console.log(`[GDPR] Deleted all ratings`);

      await Appointment.Model.deleteMany({ company: companyId });
      console.log(`[GDPR] Deleted all appointments`);

      await AuditLog.Model.deleteMany({ company: companyId });
      console.log(`[GDPR] Deleted all audit logs`);

      await Integration.deleteMany({ company: companyId });
      console.log(`[GDPR] Deleted all integrations`);

      await Company.findByIdAndDelete(companyId);
      console.log(`[GDPR] Deleted company profile`);

      return { success: true, message: "All user data has been permanently deleted" };
    } catch (err) {
      console.error("[GDPR] Error deleting data:", err.message);
      throw err;
    }
  }

  static async anonymizeConversations(companyId) {
    try {
      const chats = await CompanyChat.Model.find({ company: companyId });
      for (const chat of chats) {
        chat.user = "anonymized_" + chat._id.toString().slice(-6);
        chat.text = "[محادثة تم حذفها]";
        await chat.save();
      }
      return { success: true, anonymized: chats.length };
    } catch (err) {
      console.error("[GDPR] Error anonymizing data:", err.message);
      throw err;
    }
  }
}

export default GDPRService;

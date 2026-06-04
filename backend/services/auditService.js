import AuditLog from "../models/AuditLog.js";

class AuditService {
  static async log(companyId, userId, action, details = {}, platform = "dashboard") {
    try {
      await AuditLog.create({
        company: companyId,
        userId: userId || "system",
        action,
        details,
        platform,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[AuditService] Error logging action:", err.message);
    }
  }

  static async getLogs(companyId, options = {}) {
    try {
      const { limit = 50, offset = 0, action, from, to } = options;
      const query = { company: companyId };
      if (action) query.action = action;
      if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = from;
        if (to) query.timestamp.$lte = to;
      }

      return await AuditLog.Model.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
    } catch (err) {
      console.error("[AuditService] Error fetching logs:", err.message);
      return [];
    }
  }

  static async getLogCount(companyId, action) {
    try {
      const query = { company: companyId };
      if (action) query.action = action;
      return await AuditLog.Model.countDocuments(query);
    } catch (err) {
      return 0;
    }
  }

  static async deleteOldLogs(companyId, daysToKeep = 90) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysToKeep);
      await AuditLog.Model.deleteMany({
        company: companyId,
        timestamp: { $lt: cutoff.toISOString() },
      });
    } catch (err) {
      console.error("[AuditService] Error deleting old logs:", err.message);
    }
  }
}

export default AuditService;

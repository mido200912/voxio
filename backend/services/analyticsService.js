import CompanyChat from "../models/CompanyChat.js";
import Company from "../models/CompanyModel.js";
import Lead from "../models/Lead.js";

class AnalyticsService {
  static async getDashboardAnalytics(companyId) {
    const allChats = await CompanyChat.find({ company: companyId });
    const userMessages = allChats.filter(c => c.sender === "user");
    const aiMessages = allChats.filter(c => c.sender === "ai");
    const agentMessages = allChats.filter(c => c.sender === "agent");

    const totalConversations = userMessages.length;
    const totalMessages = allChats.length;
    const aiReplies = aiMessages.length;
    const agentReplies = agentMessages.length;

    const aiResolutionRate = totalConversations > 0
      ? Math.round((aiReplies / (aiReplies + agentReplies || 1)) * 100)
      : 0;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = new Set(
      userMessages
        .filter(c => new Date(c.createdAt) > oneHourAgo)
        .map(c => c.user)
    ).size;

    const leads = await Lead.find({ company: companyId });
    const newLeads = leads.filter(l => l.status === "new").length;

    const recentActivity = [...allChats]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 20)
      .map(c => ({
        id: c._id,
        text: c.text?.substring(0, 80),
        sender: c.sender,
        platform: c.platform || "web",
        time: c.createdAt,
      }));

    return {
      totalConversations,
      totalMessages,
      aiReplies,
      agentReplies,
      aiResolutionRate,
      activeUsers,
      newLeads,
      recentActivity,
    };
  }

  static async getTimeSeriesData(companyId, days = 30) {
    const allChats = await CompanyChat.find({ company: companyId });
    const dateMap = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dateMap[key] = { date: key, messages: 0, conversations: new Set(), ai: 0, user: 0 };
    }

    for (const chat of allChats) {
      const key = new Date(chat.createdAt).toISOString().split("T")[0];
      if (dateMap[key]) {
        dateMap[key].messages++;
        dateMap[key].conversations.add(chat.user || chat.sessionId);
        if (chat.sender === "ai") dateMap[key].ai++;
        if (chat.sender === "user") dateMap[key].user++;
      }
    }

    return Object.values(dateMap).map(d => ({
      ...d,
      conversations: d.conversations.size,
    }));
  }

  static async getPlatformDistribution(companyId) {
    const chats = await CompanyChat.find({ company: companyId });
    const platformCount = {};

    for (const chat of chats) {
      const p = chat.platform || "web";
      platformCount[p] = (platformCount[p] || 0) + 1;
    }

    return Object.entries(platformCount).map(([platform, count]) => ({
      platform,
      count,
      percentage: chats.length > 0 ? Math.round((count / chats.length) * 100) : 0,
    }));
  }

  static async getHourlyHeatmap(companyId) {
    const chats = await CompanyChat.find({ company: companyId });
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour}:00`,
      count: 0,
      percentage: 0,
    }));

    for (const chat of chats) {
      const hour = new Date(chat.createdAt).getHours();
      hourlyData[hour].count++;
    }

    const maxCount = Math.max(...hourlyData.map(h => h.count), 1);
    hourlyData.forEach(h => {
      h.percentage = Math.round((h.count / maxCount) * 100);
    });

    return hourlyData;
  }

  static async getMessageLengthAnalysis(companyId) {
    const chats = await CompanyChat.find({ company: companyId });
    const userLengths = chats.filter(c => c.sender === "user").map(c => (c.text || "").length);
    const aiLengths = chats.filter(c => c.sender === "ai").map(c => (c.text || "").length);

    const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return {
      userMessages: userLengths.length,
      aiMessages: aiLengths.length,
      averageUserLength: avg(userLengths),
      averageAiLength: avg(aiLengths),
    };
  }

  static async getResponseTimeAnalysis(companyId) {
    const chats = await CompanyChat.find({ company: companyId });
    const responseTimes = [];

    for (let i = 1; i < chats.length; i++) {
      const prev = chats[i - 1];
      const curr = chats[i];
      if (prev.sender === "user" && curr.sender === "ai") {
        const timeDiff = new Date(curr.createdAt) - new Date(prev.createdAt);
        if (timeDiff > 0 && timeDiff < 300000) {
          responseTimes.push(timeDiff);
        }
      }
    }

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    return {
      averageResponseTimeMs: avgResponseTime,
      averageResponseTimeSeconds: Math.round(avgResponseTime / 1000),
      totalResponses: responseTimes.length,
      fastestResponse: responseTimes.length > 0 ? Math.round(Math.min(...responseTimes) / 1000) : 0,
      slowestResponse: responseTimes.length > 0 ? Math.round(Math.max(...responseTimes) / 1000) : 0,
    };
  }

  static async getLeadAnalytics(companyId) {
    const leads = await Lead.find({ company: companyId });
    const sourceMap = {};
    const statusMap = {};

    for (const lead of leads) {
      const src = lead.source || "unknown";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
      const st = lead.status || "new";
      statusMap[st] = (statusMap[st] || 0) + 1;
    }

    return {
      totalLeads: leads.length,
      bySource: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
      byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    };
  }

  static async getComprehensiveReport(companyId) {
    const [dashboard, timeSeries, platforms, hourly, messages, responseTime, leads] = await Promise.all([
      AnalyticsService.getDashboardAnalytics(companyId),
      AnalyticsService.getTimeSeriesData(companyId),
      AnalyticsService.getPlatformDistribution(companyId),
      AnalyticsService.getHourlyHeatmap(companyId),
      AnalyticsService.getMessageLengthAnalysis(companyId),
      AnalyticsService.getResponseTimeAnalysis(companyId),
      AnalyticsService.getLeadAnalytics(companyId),
    ]);

    return {
      dashboard,
      timeSeries,
      platforms,
      hourly,
      messages,
      responseTime,
      leads,
      generatedAt: new Date().toISOString(),
    };
  }
}

export default AnalyticsService;

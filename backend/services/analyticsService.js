import CompanyChat from "../models/CompanyChat.js";
import Company from "../models/CompanyModel.js";
import Lead from "../models/Lead.js";

const getQuery = (companyId, days) => {
  const query = { company: companyId };
  if (days && days !== 'all') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    query.createdAt = { $gte: cutoff };
  }
  return query;
};

const filterOrders = (orders, days) => {
  if (!days || days === 'all') return orders;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(days));
  return orders.filter(o => new Date(o.date || o.createdAt || Date.now()) >= cutoff);
};

class AnalyticsService {
  static async getDashboardAnalytics(companyId, days) {
    const allChats = await CompanyChat.find(getQuery(companyId, days));
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

    const leads = await Lead.find(getQuery(companyId, days));
    const newLeads = leads.filter(l => l.status === "new").length;

    const company = await Company.findById(companyId);
    const orders = filterOrders(company?.requests || [], days);
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0);
    const totalOrders = orders.length;

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
      totalOrders,
      totalRevenue,
      recentActivity,
    };
  }

  static async getTimeSeriesData(companyId, days = 30) {
    const allChats = await CompanyChat.find(getQuery(companyId, days));
    const dateMap = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dateMap[key] = { date: key, messages: 0, conversations: new Set(), ai: 0, user: 0, revenue: 0 };
    }

    const company = await Company.findById(companyId);
    const orders = filterOrders(company?.requests || [], days);
    for (const order of orders) {
      const key = new Date(order.date || order.createdAt || Date.now()).toISOString().split("T")[0];
      if (dateMap[key]) {
        dateMap[key].revenue += parseFloat(order.totalPrice) || 0;
      }
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
      date: d.date,
      messages: d.messages,
      conversations: d.conversations.size,
      ai: d.ai,
      user: d.user,
      revenue: Math.round(d.revenue * 100) / 100,
    }));
  }

  static async getPlatformDistribution(companyId, days) {
    const chats = await CompanyChat.find(getQuery(companyId, days));
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

  static async getHourlyHeatmap(companyId, days) {
    const chats = await CompanyChat.find(getQuery(companyId, days));
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

  static async getMessageLengthAnalysis(companyId, days) {
    const chats = await CompanyChat.find(getQuery(companyId, days));
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

  static async getResponseTimeAnalysis(companyId, days) {
    const chatsRaw = await CompanyChat.find(getQuery(companyId, days));
    const chats = chatsRaw.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const responseTimes = [];

    for (let i = 1; i < chats.length; i++) {
      const prev = chats[i - 1];
      const curr = chats[i];
      if (prev.user === curr.user && prev.platform === curr.platform && prev.sender === "user" && curr.sender === "ai") {
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

  static async getRevenueAnalytics(companyId, days) {
    const company = await Company.findById(companyId);
    const orders = filterOrders(company?.requests || [], days);

    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    const sourceMap = {};
    for (const order of orders) {
      const src = order.source || "unknown";
      sourceMap[src] = (sourceMap[src] || 0) + (parseFloat(order.totalPrice) || 0);
    }

    const statusMap = {};
    for (const order of orders) {
      const st = order.status || "pending";
      statusMap[st] = (statusMap[st] || 0) + 1;
    }

    const dailyRevenue = {};
    for (const order of orders) {
      const key = new Date(order.date || order.createdAt || Date.now()).toISOString().split("T")[0];
      dailyRevenue[key] = (dailyRevenue[key] || 0) + (parseFloat(order.totalPrice) || 0);
    }

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue,
      bySource: Object.entries(sourceMap).map(([source, revenue]) => ({ source, revenue: Math.round(revenue * 100) / 100 })),
      byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  static async getLeadAnalytics(companyId, days) {
    const leads = await Lead.find(getQuery(companyId, days));
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

  static async getComprehensiveReport(companyId, days) {
    const [dashboard, timeSeries, platforms, hourly, messages, responseTime, leads, revenue] = await Promise.all([
      AnalyticsService.getDashboardAnalytics(companyId, days),
      AnalyticsService.getTimeSeriesData(companyId, days),
      AnalyticsService.getPlatformDistribution(companyId, days),
      AnalyticsService.getHourlyHeatmap(companyId, days),
      AnalyticsService.getMessageLengthAnalysis(companyId, days),
      AnalyticsService.getResponseTimeAnalysis(companyId, days),
      AnalyticsService.getLeadAnalytics(companyId, days),
      AnalyticsService.getRevenueAnalytics(companyId, days),
    ]);

    return {
      dashboard,
      timeSeries,
      platforms,
      hourly,
      messages,
      responseTime,
      leads,
      revenue,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Identifies questions the bot struggled to answer.
   * Finds user messages that were followed by AI replies containing uncertainty phrases.
   */
  static async getTopUnansweredQuestions(companyId, days = 30) {
    const chatsRaw = await CompanyChat.find(getQuery(companyId, days));
    const chats = chatsRaw.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const failureKeywords = [
      "i don't know", "i'm not sure", "cannot help", "not able to",
      "contact support", "please reach out", "unfortunately",
      "لا أعلم", "لا أستطيع", "تواصل مع", "غير متأكد", "عذراً",
    ];

    const questionFrequency = {};

    for (let i = 0; i < chats.length - 1; i++) {
      const curr = chats[i];
      const next = chats[i + 1];
      if (
        curr.sender === "user" &&
        next.sender === "ai" &&
        curr.user === next.user
      ) {
        const aiText = (next.text || "").toLowerCase();
        const failed = failureKeywords.some(kw => aiText.includes(kw));
        if (failed && curr.text) {
          const q = curr.text.trim().substring(0, 120);
          questionFrequency[q] = (questionFrequency[q] || 0) + 1;
        }
      }
    }

    return Object.entries(questionFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([question, count]) => ({ question, count }));
  }

  static async getTopAiUsers(companyId, days = 30) {
    const chats = await CompanyChat.find(getQuery(companyId, days));
    const userFrequency = {};
    for (const chat of chats) {
      if (chat.sender === "user" && chat.user) {
        const id = chat.user;
        if (!userFrequency[id]) userFrequency[id] = { count: 0, platform: chat.platform || 'web' };
        userFrequency[id].count++;
      }
    }
    return Object.entries(userFrequency)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([userId, data]) => ({ userId, count: data.count, platform: data.platform }));
  }
}

export default AnalyticsService;

import { FirestoreModel } from "../config/firestoreModel.js";

class ConversationSummaryModel extends FirestoreModel {
  async create(data) {
    return super.create({
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
}

const ConversationSummary = new ConversationSummaryModel("conversation_summaries");

class ConversationSummaryService {
  static async generateSummary(companyId, userId, platform, messages) {
    try {
      if (!messages || messages.length < 3) return null;

      const userMsgs = messages.filter((m) => m.sender === "user").map((m) => m.text || "");
      const aiMsgs = messages.filter((m) => m.sender === "ai" || m.sender === "agent").map((m) => m.text || "");

      const topics = this.extractTopics(userMsgs.join(" "));
      const sentiment = this.quickSentiment(userMsgs.join(" "));
      const outcome = this.determineOutcome(messages);
      const keyPoints = this.extractKeyPoints(userMsgs, aiMsgs);

      const summary = {
        company: companyId,
        userId,
        platform,
        totalMessages: messages.length,
        userMessages: userMsgs.length,
        aiMessages: aiMsgs.length,
        topics,
        sentiment,
        outcome,
        keyPoints,
        firstMessage: messages[0]?.text?.substring(0, 200) || "",
        lastMessage: messages[messages.length - 1]?.text?.substring(0, 200) || "",
        startedAt: messages[0]?.createdAt,
        endedAt: messages[messages.length - 1]?.createdAt,
      };

      const existing = await ConversationSummary.Model.findOne({
        company: companyId,
        userId,
        platform,
      }).lean();

      if (existing) {
        await ConversationSummary.Model.findOneAndUpdate(
          { _id: existing._id },
          { $set: summary }
        );
      } else {
        await ConversationSummary.create(summary);
      }

      return summary;
    } catch (err) {
      console.error("[Summary] Error generating summary:", err.message);
      return null;
    }
  }

  static extractTopics(text) {
    const topicKeywords = {
      "طلب شراء": ["شراء", "طلب", "سعر", "كم", "تكلفة", "buy", "order", "price", "cost"],
      "شكوى": ["شكوى", "مشكلة", "غلط", "سيء", "complaint", "problem", "issue", "wrong"],
      "استفسار": ["سؤال", "استفسار", "عايز أعرف", "ممكن", "question", "inquiry", "wondering"],
      "دعم فني": ["دعم", "technical", "-support", "help", "مساعدة", "fix", "إصلاح"],
      "شحن": ["شحن", "توصيل", "موعد", "delivery", "shipping", "track"],
      "إلغاء": ["إلغاء", "cancel", "refund", "استرجاع", "مرتجع"],
    };

    const found = [];
    const lowerText = text.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        found.push(topic);
      }
    }
    return found.length ? found : ["عام"];
  }

  static quickSentiment(text) {
    const positive = ["شكراً", "ممتاز", "رائع", "تمام", "حلو", "thanks", "great", "good", "perfect"];
    const negative = ["سيء", "مش كويس", "غلط", "زبالة", "bad", "terrible", "hate", "angry"];

    const lower = text.toLowerCase();
    const pos = positive.filter((w) => lower.includes(w)).length;
    const neg = negative.filter((w) => lower.includes(w)).length;

    if (pos > neg) return "positive";
    if (neg > pos) return "negative";
    return "neutral";
  }

  static determineOutcome(messages) {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return "unknown";

    const lastText = (lastMsg.text || "").toLowerCase();
    if (lastText.includes("save_order")) return "order_placed";
    if (lastText.includes("save_lead")) return "lead_captured";
    if (lastText.includes("human_handoff")) return "handoff_requested";
    if (lastMsg.sender === "user") return "customer_last";

    return "resolved";
  }

  static extractKeyPoints(userMsgs, aiMsgs) {
    const points = [];
    for (const msg of userMsgs) {
      if (msg.length > 10 && msg.length < 200) {
        points.push(msg.substring(0, 100));
      }
    }
    return points.slice(0, 5);
  }

  static async getSummaries(companyId, options = {}) {
    try {
      const { limit = 20, platform } = options;
      const query = { company: companyId };
      if (platform) query.platform = platform;

      return await ConversationSummary.Model.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (err) {
      return [];
    }
  }

  static async getSummaryStats(companyId) {
    try {
      const summaries = await ConversationSummary.Model.find({ company: companyId }).lean();
      if (!summaries.length) {
        return { total: 0, avgMessages: 0, sentimentBreakdown: {}, topTopics: [], outcomes: {} };
      }

      const total = summaries.length;
      const avgMessages = summaries.reduce((s, c) => s + (c.totalMessages || 0), 0) / total;

      const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
      const outcomes = {};
      const topicCounts = {};

      summaries.forEach((s) => {
        sentimentBreakdown[s.sentiment] = (sentimentBreakdown[s.sentiment] || 0) + 1;
        outcomes[s.outcome] = (outcomes[s.outcome] || 0) + 1;
        (s.topics || []).forEach((t) => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      });

      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }));

      return { total, avgMessages: Math.round(avgMessages), sentimentBreakdown, topTopics, outcomes };
    } catch (err) {
      return { total: 0, avgMessages: 0, sentimentBreakdown: {}, topTopics: [], outcomes: {} };
    }
  }
}

export default ConversationSummaryService;

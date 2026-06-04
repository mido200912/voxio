import { FirestoreModel } from "../config/firestoreModel.js";

class LearningPatternModel extends FirestoreModel {
  async create(data) {
    return super.create({
      score: 1,
      ...data,
    });
  }
}

const LearningPattern = new LearningPatternModel("ai_learning_patterns");

class AILearningService {
  static async learnFromAgentReply(companyId, userId, platform, userMessage, agentReply) {
    try {
      if (!companyId || !userMessage || !agentReply) return;

      const existing = await LearningPattern.Model.findOne({
        company: companyId,
        userMessage: userMessage.substring(0, 200),
      }).lean();

      if (existing) {
        existing.score = (existing.score || 1) + 1;
        await LearningPattern.Model.findOneAndUpdate(
          { _id: existing._id },
          { $set: { score: existing.score, agentReply } }
        );
      } else {
        await LearningPattern.create({
          company: companyId,
          userId: userId || "unknown",
          platform: platform || "unknown",
          userMessage: userMessage.substring(0, 500),
          agentReply: agentReply.substring(0, 1000),
          score: 1,
        });
      }
    } catch (err) {
      console.error("[AILearning] Error saving pattern:", err.message);
    }
  }

  static async getRelevantExamples(companyId, userMessage, limit = 5) {
    try {
      const patterns = await LearningPattern.Model.find({
        company: companyId,
      })
        .sort({ score: -1 })
        .limit(50)
        .lean();

      if (!patterns.length) return [];

      const words = userMessage
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const scored = patterns.map((p) => {
        const pWords = (p.userMessage || "").toLowerCase().split(/\s+/);
        const overlap = words.filter((w) => pWords.includes(w)).length;
        return { ...p, relevance: overlap + (p.score || 1) * 0.5 };
      });

      scored.sort((a, b) => b.relevance - a.relevance);
      return scored.slice(0, limit).filter((p) => p.relevance > 0);
    } catch (err) {
      console.error("[AILearning] Error fetching examples:", err.message);
      return [];
    }
  }

  static async generateLearningContext(companyId) {
    try {
      const topPatterns = await LearningPattern.Model.find({
        company: companyId,
      })
        .sort({ score: -1 })
        .limit(10)
        .lean();

      if (!topPatterns.length) return "";

      const examples = topPatterns
        .map(
          (p, i) =>
            `النمط ${i + 1}:\nالعميل: ${p.userMessage}\nالرد الصحيح: ${p.agentReply}`
        )
        .join("\n\n");

      return `\n📝 **أمثلة من ردود الموظفين السابقين (تعلم من المحادثات):**\n${examples}\n\nاستخدم هذه الأمثلة كمرجع لتحسين ردودك. إذا كان سؤال العميل مشابه لأحد هذه الأمثلة، استخدم الأسلوب نفسه في الرد.`;
    } catch (err) {
      console.error("[AILearning] Error generating context:", err.message);
      return "";
    }
  }

  static async getPatterns(companyId) {
    try {
      return await LearningPattern.Model.find({ company: companyId })
        .sort({ score: -1 })
        .lean();
    } catch (err) {
      return [];
    }
  }

  static async deletePattern(patternId, companyId) {
    try {
      await LearningPattern.Model.findOneAndDelete({
        _id: patternId,
        company: companyId,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  static async addPattern(companyId, userMessage, agentReply, platform = "manual") {
    try {
      return await LearningPattern.create({
        company: companyId,
        userId: "manual",
        platform,
        userMessage,
        agentReply,
        score: 1,
      });
    } catch (err) {
      console.error("[AILearning] Error adding pattern:", err.message);
      return null;
    }
  }
}

export default AILearningService;

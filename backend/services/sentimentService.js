const POSITIVE_WORDS_AR = [
  "شكرًا", "شكراً", "ممتاز", "جميل", "رائع", "مبدع", "حلو", "تمام",
  "أحسنت", "برافو", "عسل", "نور", "حلوة", "فلاة", "أحلى", "أفضل",
  "مبهج", "مريح", "سلس", "سهل", "مقبول", "راضي", "سعيد", "مبسوط",
  "كل حاجة تمام", "كويس", "أكيد", "نعم", "بلى", "طبعاً", "iah",
  "thanks", "thank you", "great", "awesome", "perfect", "excellent",
  "good", "nice", "amazing", "wonderful", "love", "best", "happy",
  "pleased", "helpful", "fantastic", "brilliant", "superb", "ok",
  "yes", "sure", "absolutely", "definitely", "cool", "sweet",
];

const NEGATIVE_WORDS_AR = [
  "سيء", "مش كويس", "غلط", "مفيش فايدة", "زبالة", "حرام", "مش عايز",
  "بعيد", "بطيء", "غالي", "مكلّف", "مش راضي", "مستغرب", "محبط",
  "زهقان", "متضايق", "غضبان", "حاسس بحاجة غلط", "مش فاهم", "تلخبط",
  "هبل", "سخيف", "مقرف", "فاضي", "ملّيت", "كفاية", "مش هينفع",
  "معلش", "مش معقول", "استحالة", "لا", "أبداً", "حرام عليكم",
  "bad", "terrible", "awful", "horrible", "worst", "hate", "angry",
  "frustrated", "annoyed", "disappointed", "slow", "expensive",
  "useless", "waste", "poor", "broken", "problem", "issue", "wrong",
  "fail", "failed", "error", "stupid", "ridiculous", "unacceptable",
  "no", "never", "cancel", "refund", "complaint",
];

const NEUTRAL_WORDS = [
  "تمام", "حسناً", "أوكي", "ok", "okay", "fine", "alright",
  "mhmm", "uh", "ah", "مممم", "خليني أفكر", "مستني", "لحظة",
];

class SentimentService {
  static analyzeSentiment(text) {
    if (!text || typeof text !== "string") {
      return { sentiment: "neutral", score: 0.5, keywords: [] };
    }

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const foundKeywords = [];

    for (const word of words) {
      if (POSITIVE_WORDS_AR.some((pw) => word.includes(pw) || pw.includes(word))) {
        positiveCount++;
        foundKeywords.push({ word, type: "positive" });
      }
      if (NEGATIVE_WORDS_AR.some((nw) => word.includes(nw) || nw.includes(word))) {
        negativeCount++;
        foundKeywords.push({ word, type: "negative" });
      }
      if (NEUTRAL_WORDS.some((nw) => word.includes(nw) || nw.includes(word))) {
        neutralCount++;
      }
    }

    const total = positiveCount + negativeCount + neutralCount || 1;
    let sentiment = "neutral";
    let score = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = "positive";
      score = 0.5 + (positiveCount / total) * 0.5;
    } else if (negativeCount > positiveCount) {
      sentiment = "negative";
      score = 0.5 - (negativeCount / total) * 0.5;
    }

    score = Math.max(0, Math.min(1, score));

    if (text.includes("?") || text.includes("؟")) {
      if (sentiment === "neutral") score = 0.5;
    }

    const exclamations = (text.match(/[!！]/g) || []).length +
      (text.match(//g) || []).length;
    if (exclamations > 0 && sentiment === "positive") {
      score = Math.min(1, score + exclamations * 0.05);
    }
    if (exclamations > 0 && sentiment === "negative") {
      score = Math.max(0, score - exclamations * 0.05);
    }

    return {
      sentiment,
      score: Math.round(score * 100) / 100,
      keywords: foundKeywords.slice(0, 5),
    };
  }

  static async analyzeConversationSentiment(messages) {
    if (!messages || !messages.length) {
      return { overall: "neutral", score: 0.5, trend: "stable", userMessages: 0 };
    }

    const userMessages = messages.filter((m) => m.sender === "user");
    if (!userMessages.length) {
      return { overall: "neutral", score: 0.5, trend: "stable", userMessages: 0 };
    }

    const sentiments = userMessages.map((m) => this.analyzeSentiment(m.text || ""));
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;

    let overall = "neutral";
    if (avgScore > 0.6) overall = "positive";
    else if (avgScore < 0.4) overall = "negative";

    let trend = "stable";
    if (sentiments.length >= 3) {
      const firstHalf = sentiments.slice(0, Math.floor(sentiments.length / 2));
      const secondHalf = sentiments.slice(Math.floor(sentiments.length / 2));
      const firstAvg = firstHalf.reduce((s, x) => s + x.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, x) => s + x.score, 0) / secondHalf.length;

      if (secondAvg - firstAvg > 0.1) trend = "improving";
      else if (firstAvg - secondAvg > 0.1) trend = "declining";
    }

    return {
      overall,
      score: Math.round(avgScore * 100) / 100,
      trend,
      userMessages: userMessages.length,
      lastSentiment: sentiments[sentiments.length - 1],
    };
  }
}

export default SentimentService;

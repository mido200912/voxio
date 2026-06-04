import { FirestoreModel } from "../config/firestoreModel.js";

class ProactiveRuleModel extends FirestoreModel {
  async create(data) {
    return super.create({
      isActive: true,
      ...data,
    });
  }
}

const ProactiveRule = new ProactiveRuleModel("proactive_rules");

class ProactiveMessagingService {
  static async createRule(companyId, rule) {
    try {
      return await ProactiveRule.create({
        company: companyId,
        name: rule.name || "Untitled Rule",
        trigger: rule.trigger,
        message: rule.message,
        platform: rule.platform || "all",
        conditions: rule.conditions || {},
        isActive: true,
      });
    } catch (err) {
      console.error("[Proactive] Error creating rule:", err.message);
      return null;
    }
  }

  static async getRules(companyId) {
    try {
      return await ProactiveRule.Model.find({ company: companyId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (err) {
      return [];
    }
  }

  static async updateRule(ruleId, companyId, updates) {
    try {
      return await ProactiveRule.Model.findOneAndUpdate(
        { _id: ruleId, company: companyId },
        { $set: updates },
        { new: true }
      );
    } catch (err) {
      return null;
    }
  }

  static async deleteRule(ruleId, companyId) {
    try {
      await ProactiveRule.Model.findOneAndDelete({
        _id: ruleId,
        company: companyId,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  static async toggleRule(ruleId, companyId) {
    try {
      const rule = await ProactiveRule.Model.findOne({
        _id: ruleId,
        company: companyId,
      });
      if (!rule) return null;
      rule.isActive = !rule.isActive;
      await rule.save();
      return rule;
    } catch (err) {
      return null;
    }
  }

  static async checkTriggers(companyId, event) {
    try {
      const rules = await ProactiveRule.Model.find({
        company: companyId,
        isActive: true,
      }).lean();

      const triggered = [];
      for (const rule of rules) {
        if (rule.trigger === event.type) {
          if (this.evaluateConditions(rule.conditions, event)) {
            triggered.push(rule);
          }
        }
      }
      return triggered;
    } catch (err) {
      return [];
    }
  }

  static evaluateConditions(conditions, event) {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    if (conditions.inactiveMinutes) {
      const lastActive = event.lastActiveAt ? new Date(event.lastActiveAt) : null;
      if (lastActive) {
        const diff = (Date.now() - lastActive.getTime()) / 60000;
        if (diff < conditions.inactiveMinutes) return false;
      }
    }

    if (conditions.platform && conditions.platform !== "all") {
      if (event.platform !== conditions.platform) return false;
    }

    if (conditions.minMessages) {
      if ((event.messageCount || 0) < conditions.minMessages) return false;
    }

    return true;
  }
}

export default ProactiveMessagingService;

import { FirestoreModel } from "../config/firestoreModel.js";
import crypto from "crypto";

class CompanyModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      apiKey: crypto.randomBytes(24).toString("hex"),
      chatToken: `vchat_${crypto.randomBytes(16).toString("hex")}`,
      slug: data.name ? data.name.toLowerCase().replace(/ /g, "-") : `company-${Date.now()}`,
      websiteUrl: data.websiteUrl || "",
      allowedDomains: data.allowedDomains || [],
      requests: [],
      knowledgeBase: [],
      extractedKnowledge: "",
      urlExtractedKnowledge: "",
      customInstructions: "",
      websiteConfig: {
        themeColor: "#4f46e5",
        backgroundColor: "#000000",
        welcomeMessage: "Hello! How can I help you today?",
        botName: data.name || "Assistant",
        layout: "centered",
        font: "Inter"
      },
      aiSettings: {
        mode: 'restricted', // 'general' or 'restricted'
        model: 'inclusionai/ring-2.6-1t:free',
        languages: ['Arabic', 'English']
      },
      ...data
    };
    return super.create(defaultData);
  }
}

const Company = new CompanyModel("companies");
export default Company;

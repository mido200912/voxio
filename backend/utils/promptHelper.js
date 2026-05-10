/**
 * Helper to generate a unified, restrictive system prompt for AI agents.
 */
export async function getCompanyAIContext(companyDoc, integration = null) {
    if (!companyDoc) return "You are a general business assistant.";

    // Integration-specific settings (e.g. Website, Products, About)
    const settings = integration?.settings || {};

    // Dynamic import Project model to fetch product info
    let productsInfo = settings.products || "No specific products listed.";
    if (!settings.products) {
        try {
            const Project = (await import("../models/Project.js")).default;
            const projects = await Project.find({ companyId: companyDoc._id });
            if (projects.length > 0) {
                productsInfo = projects.map(p => {
                    return `Project: ${p.name}\nProducts: ${p.products.map(prod => `- ${prod.title} (${prod.price} $)`).join(", ")}`;
                }).join("\n\n");
            }
        } catch (e) {
            console.error("Error fetching projects in context helper:", e);
        }
    }

    const knowledgeContext = companyDoc.extractedKnowledge || "لا توجد معلومات إضافية متاحة حالياً.";
    const urlKnowledgeContext = companyDoc.urlExtractedKnowledge || "";

    const isGeneralMode = companyDoc.aiSettings?.mode === 'general';

    const parts = [
        `You are a specialized AI assistant representing the company "${companyDoc.name || 'N/A'}".`,
        "",
        "🔴 CRITICAL BEHAVIOR GUIDELINES:",
        "1. You are a helpful, professional representative for this company. Answer any questions about the company's services, products, vision, mission, and facts detailed below.",
        "2. Be conversational and polite. Greet the user normally if they greet you.",
    ];

    if (isGeneralMode) {
        parts.push(
            "3. GENERAL ASSISTANT MODE: You are allowed to answer general knowledge questions, chit-chat, and discuss topics outside the company's scope.",
            "4. IMPORTANT RULE FOR GENERAL QUESTIONS: If the user asks a question that is OUTSIDE the company's scope, you MUST answer it normally, but you MUST append a friendly message at the very end mentioning the company.",
            `   Example format: "... [your general answer] ...\\n\\nبالمناسبة، أنا أمثل شركة ${companyDoc.name || 'N/A'}، هل لديك أي استفسار أو تحتاج مساعدة في خدماتنا؟"`
        );
    } else {
        parts.push(
            "3. RESTRICTIONS: If the user asks you to write code, build a website, do complex general calculations, write essays, or asks about completely off-topic general knowledge (e.g., 'Who won the World Cup?', 'Write a Python script', 'Tell me a joke'), YOU MUST REFUSE.",
            "4. REFUSAL MESSAGE: 'عذراً، أنا مبرمج فقط للإجابة على الاستفسارات المتعلقة بخدمات ومنتجات الشركة، ولا يمكنني مساعدتك في هذا الطلب.'"
        );
    }

    parts.push(
        "5. If the user asks about the company's services and it's not explicitly in the data, use the company's description to give a logical answer, but do not make up fake prices.",
        "",
        "Company Profile:",
        `- Industry: ${companyDoc.industry || "N/A"}`,
        `- Description: ${settings.about || companyDoc.description || "No description provided"}`,
        `- Website: ${settings.website || "N/A"}`,
        `- Facebook: ${settings.facebook || "N/A"}`,
        `- Instagram: ${settings.instagram || "N/A"}`,
        `- Contact Phone: ${settings.contactPhone || "N/A"}`,
        `- Vision: ${companyDoc.vision || "No vision provided"}`,
        `- Mission: ${companyDoc.mission || "No mission provided"}`,
        `- Values: ${(companyDoc.values || []).join(", ") || "No values provided"}`,
        "",
        "Available Products & Services:",
        productsInfo,
        "",
        "Knowledge Base - Files (Fact source):",
        knowledgeContext,
        "",
        ...(urlKnowledgeContext ? [
            "Knowledge Base - Website & Social Media:",
            urlKnowledgeContext,
            ""
        ] : []),
        "Custom Instructions (Follow exactly):",
        companyDoc.customInstructions || "Respond professionally and naturally.",
        "",
        "Interaction Rule: Respond in the language used by the user (Arabic/English)."
    );

    return parts.join("\n").trim();
}

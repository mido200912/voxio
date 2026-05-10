import Company from "../models/Company.js";

// Middleware للتحقق من صحة مفتاح API
const verifyApiKey = async (req, res, next) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "apiKey مفقود" });
  
      const company = await Company.findOne({ apiKey });
      if (!company) return res.status(403).json({ error: "apiKey غير صالح" });
  
      // 🛡️ Security Check: Verify Origin/Referer matches allowed domains
      const origin = req.headers.origin || req.headers.referer || "";
      const allowedDomains = company.allowedDomains || [];
      const websiteUrl = company.websiteUrl || "";

      // Add websiteUrl to allowed domains if it exists
      const allAllowed = [...allowedDomains];
      if (websiteUrl) {
        try {
          const url = new URL(websiteUrl);
          allAllowed.push(url.origin, url.hostname);
        } catch (e) {
          allAllowed.push(websiteUrl);
        }
      }

      // If allowedDomains is set, strictly enforce it
      if (allAllowed.length > 0) {
        const isAllowed = allAllowed.some(domain => origin.includes(domain)) || origin.includes("localhost") || origin.includes("127.0.0.1");
        if (!isAllowed) {
            console.warn(`🛑 Blocked unauthorized domain: ${origin} for company ${company.name}`);
            return res.status(403).json({ error: "Unauthorized domain. This API key is restricted." });
        }
      }

      req.company = company; 
      next();
    } catch (err) {
      console.error("verifyApiKey error:", err.message);
      res.status(500).json({ error: "خطأ أثناء التحقق من مفتاح API" });
    }
  };
export { verifyApiKey };

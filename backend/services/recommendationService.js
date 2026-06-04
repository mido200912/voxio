import Product from "../models/Product.js";
import CompanyChat from "../models/CompanyChat.js";

class ProductRecommendationService {
  static async getRecommendations(companyId, userMessage, limit = 3) {
    try {
      const products = await Product.Model.find({ company: companyId, isActive: true })
        .sort({ popularity: -1 })
        .limit(50)
        .lean();

      if (!products.length) return [];

      const lowerMsg = (userMessage || "").toLowerCase();
      const words = lowerMsg.split(/\s+/).filter((w) => w.length > 2);

      const scored = products.map((p) => {
        let score = 0;
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const category = (p.category || "").toLowerCase();

        for (const word of words) {
          if (name.includes(word)) score += 3;
          if (desc.includes(word)) score += 2;
          if (category.includes(word)) score += 2;
        }

        if (p.inventory > 0) score += 1;
        if (p.images && p.images.length > 0) score += 0.5;

        return { ...p, relevanceScore: score };
      });

      scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return scored.slice(0, limit).filter((p) => p.relevanceScore > 0);
    } catch (err) {
      console.error("[Recommendation] Error:", err.message);
      return [];
    }
  }

  static async getPopularProducts(companyId, limit = 5) {
    try {
      return await Product.Model.find({ company: companyId, isActive: true })
        .sort({ popularity: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (err) {
      return [];
    }
  }

  static async getProductsInCategory(companyId, category, limit = 5) {
    try {
      return await Product.Model.find({
        company: companyId,
        isActive: true,
        category: { $regex: category, $options: "i" },
      })
        .limit(limit)
        .lean();
    } catch (err) {
      return [];
    }
  }

  static async getProductById(companyId, productId) {
    try {
      return await Product.Model.findOne({
        _id: productId,
        company: companyId,
      }).lean();
    } catch (err) {
      return null;
    }
  }

  static formatProductMessage(product, isArabic = true) {
    if (!product) return "";

    const name = product.name || "منتج";
    const price = product.price ? `${product.price} ${product.currency || "USD"}` : "";
    const desc = product.description ? product.description.substring(0, 100) : "";

    if (isArabic) {
      let msg = `📦 **${name}**`;
      if (price) msg += `\n💰 السعر: ${price}`;
      if (desc) msg += `\n📝 ${desc}`;
      if (product.images && product.images.length > 0) {
        msg += `\n🖼️ ${product.images[0]}`;
      }
      return msg;
    }

    let msg = `📦 **${name}**`;
    if (price) msg += `\n💰 Price: ${price}`;
    if (desc) msg += `\n📝 ${desc}`;
    if (product.images && product.images.length > 0) {
      msg += `\n🖼️ ${product.images[0]}`;
    }
    return msg;
  }

  static async incrementPopularity(companyId, productId) {
    try {
      await Product.Model.findOneAndUpdate(
        { _id: productId, company: companyId },
        { $inc: { popularity: 1 } }
      );
    } catch (err) {
      // non-critical
    }
  }
}

export default ProductRecommendationService;

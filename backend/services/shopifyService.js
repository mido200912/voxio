import axios from "axios";
import Integration from "../models/Integration.js";
import Company from "../models/CompanyModel.js";

const SHOPIFY_API_VERSION = "2024-01";

class ShopifyService {
  constructor(shopUrl, accessToken) {
    this.shopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.accessToken = accessToken;
    this.baseUrl = `https://${this.shopUrl}/admin/api/${SHOPIFY_API_VERSION}`;
  }

  async request(method, path, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  async getProducts(limit = 250) {
    return this.request("GET", `/products.json?limit=${limit}`);
  }

  async getOrders(limit = 50, status = "any") {
    return this.request("GET", `/orders.json?limit=${limit}&status=${status}`);
  }

  async getProduct(id) {
    return this.request("GET", `/products/${id}.json`);
  }

  async getOrder(id) {
    return this.request("GET", `/orders/${id}.json`);
  }

  async getShopInfo() {
    return this.request("GET", "/shop.json");
  }

  async registerWebhook(topic, callbackUrl) {
    return this.request("POST", "/webhooks.json", {
      webhook: {
        topic,
        address: callbackUrl,
        format: "json",
      },
    });
  }

  async getWebhooks() {
    return this.request("GET", "/webhooks.json");
  }

  async deleteWebhook(id) {
    return this.request("DELETE", `/webhooks/${id}.json`);
  }

  static async findIntegrationByShop(shopUrl) {
    const cleanShop = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const integrations = await Integration.find({ platform: "shopify" });
    return integrations.find(
      (i) => i.credentials?.shopUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") === cleanShop
    );
  }

  static async processOrderWebhook(shopUrl, orderData) {
    try {
      const integration = await ShopifyService.findIntegrationByShop(shopUrl);
      if (!integration) {
        console.error(`[Shopify Webhook] No integration found for shop: ${shopUrl}`);
        return;
      }

      const company = await Company.findById(integration.company);
      if (!company) {
        console.error(`[Shopify Webhook] No company found for integration`);
        return;
      }

      const order = {
        source: "shopify",
        platform: "shopify",
        orderId: orderData.id?.toString(),
        orderNumber: orderData.order_number,
        customerName: `${orderData.customer?.first_name || ""} ${orderData.customer?.last_name || ""}`.trim(),
        customerEmail: orderData.customer?.email || "",
        customerPhone: orderData.customer?.phone || "",
        totalPrice: parseFloat(orderData.total_price || 0),
        currency: orderData.currency || "USD",
        items: (orderData.line_items || []).map((item) => ({
          name: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price || 0),
          sku: item.sku || "",
        })),
        status: orderData.financial_status || "pending",
        fulfillmentStatus: orderData.fulfillment_status || "unfulfilled",
        createdAt: new Date(orderData.created_at) || new Date(),
        rawData: orderData,
      };

      company.requests = company.requests || [];
      company.requests.push(order);
      await company.save();

      console.log(`[Shopify Webhook] Order #${order.orderNumber} saved for ${company.name}`);

      return { company, order };
    } catch (err) {
      console.error("[Shopify Webhook] Error processing order:", err.message);
      return null;
    }
  }

  static async processProductWebhook(shopUrl, productData) {
    try {
      const integration = await ShopifyService.findIntegrationByShop(shopUrl);
      if (!integration) return;

      const company = await Company.findById(integration.company);
      if (!company) return;

      const Product = (await import("../models/Product.js")).default;
      const sku = productData.variants?.[0]?.sku || `shopify_${productData.id}`;
      const existing = await Product.findOne({ company: company._id, sku });

      const product = {
        company: company._id,
        name: productData.title,
        description: productData.body_html?.replace(/<[^>]*>/g, "") || "",
        price: parseFloat(productData.variants?.[0]?.price || 0),
        currency: "USD",
        images: productData.images?.map((i) => i.src) || [],
        category: productData.product_type || "",
        sku,
        inventory: productData.variants?.[0]?.inventory_quantity || 0,
        platforms: ["shopify"],
        metadata: { shopifyId: productData.id },
      };

      if (existing) {
        Object.assign(existing, product);
        await existing.save();
      } else {
        await Product.create(product);
      }

      console.log(`[Shopify Webhook] Product ${productData.title} synced`);
    } catch (err) {
      console.error("[Shopify Webhook] Error syncing product:", err.message);
    }
  }
}

export default ShopifyService;

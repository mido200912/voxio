import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { fetchAiResponse } from "../utils/corexHelper.js";

puppeteer.use(StealthPlugin());

class AiNavigator {
  constructor(company) {
    this.company = company;
    this.browser = null;
    this.page = null;
    this.currentUrl = "";
    this.actionLog = [];
  }

  async launch(headless = true) {
    this.browser = await puppeteer.launch({
      headless,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    return this.page;
  }

  async navigate(url) {
    try {
      await this.page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      this.currentUrl = this.page.url();
      this.actionLog.push({ action: "navigate", url, success: true });
      return { success: true, url: this.currentUrl, title: await this.page.title() };
    } catch (err) {
      this.actionLog.push({ action: "navigate", url, success: false, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async click(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.click(selector);
      await this.page.waitForTimeout(1000);
      this.currentUrl = this.page.url();
      this.actionLog.push({ action: "click", selector, success: true });
      return { success: true, url: this.currentUrl };
    } catch (err) {
      this.actionLog.push({ action: "click", selector, success: false, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async type(selector, text) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.type(selector, text, { delay: 50 });
      this.actionLog.push({ action: "type", selector, success: true });
      return { success: true };
    } catch (err) {
      this.actionLog.push({ action: "type", selector, success: false, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async fillForm(fields) {
    const results = [];
    for (const { selector, value } of fields) {
      const result = await this.type(selector, value);
      results.push(result);
    }
    return results;
  }

  async getPageText() {
    try {
      const text = await this.page.evaluate(() => document.body.innerText);
      return text.substring(0, 5000);
    } catch {
      return "";
    }
  }

  async getPageHtml() {
    try {
      return await this.page.content();
    } catch {
      return "";
    }
  }

  async screenshot() {
    try {
      return await this.page.screenshot({ encoding: "base64", type: "jpeg", quality: 70 });
    } catch {
      return null;
    }
  }

  async search(query) {
    try {
      const searchInput = await this.page.$('input[type="search"], input[type="text"], input[name="q"], input[name="search"]');
      if (searchInput) {
        await searchInput.click();
        await searchInput.type(query, { delay: 50 });
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(3000);
        this.actionLog.push({ action: "search", query, success: true });
        return { success: true, url: this.page.url() };
      }
      return { success: false, error: "No search input found" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async addToCart(productSelector) {
    try {
      const addToCartBtn = await this.page.$(
        `${productSelector} button, ${productSelector} [type="submit"], button[name="add"], [aria-label*="Add to cart"], [aria-label*="add to cart"]`
      );
      if (addToCartBtn) {
        await addToCartBtn.click();
        await this.page.waitForTimeout(2000);
        this.actionLog.push({ action: "addToCart", success: true });
        return { success: true };
      }
      return { success: false, error: "Add to cart button not found" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async executePlan(plan) {
    const results = [];
    for (const step of plan) {
      let result;
      switch (step.action) {
        case "navigate":
          result = await this.navigate(step.url);
          break;
        case "click":
          result = await this.click(step.selector);
          break;
        case "type":
          result = await this.type(step.selector, step.text);
          break;
        case "search":
          result = await this.search(step.query);
          break;
        case "addToCart":
          result = await this.addToCart(step.productSelector);
          break;
        case "fillForm":
          result = await this.fillForm(step.fields);
          break;
        case "screenshot":
          result = { data: await this.screenshot() };
          break;
        default:
          result = { success: false, error: `Unknown action: ${step.action}` };
      }
      results.push({ step, result });
    }
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  static async interpretUserRequest(userRequest, company, pageContext = "") {
    const systemPrompt = `You are an AI web navigator for the company "${company.name}".
Your job is to interpret the user's request and create a step-by-step plan to execute it in a web browser.

Available actions:
- navigate: Go to a URL
- click: Click on a CSS selector
- type: Type text into a field
- search: Search on the current page
- addToCart: Add a product to cart
- fillForm: Fill multiple form fields
- screenshot: Take a screenshot

Current page context:
${pageContext || "No page loaded yet"}

Respond with ONLY a JSON array of steps. Example:
[{"action":"navigate","url":"https://example.com"},{"action":"search","query":"blue shoes"},{"action":"addToCart","productSelector":".product-card:first-child"}]`;

    const result = await fetchAiResponse(
      `${systemPrompt}\n\nUser request: ${userRequest}`,
      "[]",
      "inclusionai/ring-2.6-1t"
    );

    try {
      const startIdx = result.indexOf("[");
      const endIdx = result.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1) {
        return JSON.parse(result.substring(startIdx, endIdx + 1));
      }
    } catch (e) {
      console.error("[AiNavigator] Failed to parse AI response:", e.message);
    }
    return [];
  }
}

export default AiNavigator;

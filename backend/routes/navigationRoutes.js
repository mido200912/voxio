import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/CompanyModel.js";
import AiNavigator from "../services/aiNavigator.js";

const router = express.Router();

// Active navigation sessions
const activeSessions = new Map();

// @route   POST /api/navigate/start
// @desc    Start a new AI navigation session
router.post("/start", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { url } = req.body;
    const sessionId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const navigator = new AiNavigator(company);
    await navigator.launch();

    if (url) {
      await navigator.navigate(url);
    }

    activeSessions.set(sessionId, navigator);

    res.json({
      sessionId,
      url: navigator.currentUrl || url || "",
      status: "started",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/navigate/execute
// @desc    Execute a user request via AI navigation
router.post("/execute", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { sessionId, request, url } = req.body;
    if (!request) return res.status(400).json({ error: "Request is required" });

    let navigator;

    if (sessionId && activeSessions.has(sessionId)) {
      navigator = activeSessions.get(sessionId);
    } else {
      navigator = new AiNavigator(company);
      await navigator.launch();
      if (url) await navigator.navigate(url);
      const newSessionId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      activeSessions.set(newSessionId, navigator);
      return res.json({ sessionId: newSessionId, message: "Session created. Send request again to execute." });
    }

    const pageContext = await navigator.getPageText();
    const plan = await AiNavigator.interpretUserRequest(request, company, pageContext);

    if (!plan || plan.length === 0) {
      return res.status(400).json({ error: "Could not interpret request. Try being more specific." });
    }

    const results = await navigator.executePlan(plan);
    const screenshot = await navigator.screenshot();

    res.json({
      sessionId,
      plan,
      results,
      currentUrl: navigator.currentUrl,
      pageTitle: await navigator.page?.title() || "",
      screenshot,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/navigate/action
// @desc    Execute a specific navigation action
router.post("/action", requireAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { sessionId, action, params } = req.body;
    if (!sessionId || !action) {
      return res.status(400).json({ error: "Session ID and action are required" });
    }

    const navigator = activeSessions.get(sessionId);
    if (!navigator) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    let result;
    switch (action) {
      case "navigate":
        result = await navigator.navigate(params.url);
        break;
      case "click":
        result = await navigator.click(params.selector);
        break;
      case "type":
        result = await navigator.type(params.selector, params.text);
        break;
      case "search":
        result = await navigator.search(params.query);
        break;
      case "addToCart":
        result = await navigator.addToCart(params.productSelector);
        break;
      case "screenshot":
        result = { data: await navigator.screenshot() };
        break;
      case "getText":
        result = { text: await navigator.getPageText() };
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.json({ sessionId, action, result, currentUrl: navigator.currentUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/navigate/session/:sessionId
// @desc    Get session status
router.get("/session/:sessionId", requireAuth, (req, res) => {
  const navigator = activeSessions.get(req.params.sessionId);
  if (!navigator) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json({
    sessionId: req.params.sessionId,
    currentUrl: navigator.currentUrl,
    actionLog: navigator.actionLog,
    active: navigator.browser !== null,
  });
});

// @route   DELETE /api/navigate/session/:sessionId
// @desc    Close a navigation session
router.delete("/session/:sessionId", requireAuth, async (req, res) => {
  const navigator = activeSessions.get(req.params.sessionId);
  if (navigator) {
    await navigator.close();
    activeSessions.delete(req.params.sessionId);
  }
  res.json({ message: "Session closed" });
});

export default router;

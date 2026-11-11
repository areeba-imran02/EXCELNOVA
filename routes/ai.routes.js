const router = require("express").Router();
const { runAssistant } = require("../agents/orchestrator");
const { generateWithFallback, getConfiguredModels } = require("../services/gemini.service");

router.get("/models", (req, res) => {
  res.json({ configuredModels: getConfiguredModels(), keyConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

router.post("/chat", async (req, res, next) => {
  try {
    const { message, context = {}, history = [] } = req.body || {};
    if (typeof message !== "string" || !message.trim() || message.length > 12000) {
      return res.status(400).json({ error: "Message is required and must be under 12,000 characters." });
    }
    const result = await runAssistant({ message: message.trim(), context, history });
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message, code: error.code });
    next(error);
  }
});

router.post("/stream", async (req, res) => {
  const { message, context = {}, history = [] } = req.body || {};
  if (typeof message !== "string" || !message.trim() || message.length > 12000) {
    return res.status(400).json({ error: "Message is required and must be under 12,000 characters." });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const controller = new AbortController();
  req.on("close", () => controller.abort());

  try {
    const result = await runAssistant({
      message: message.trim(), context, history,
      onEvent: (event) => send("agent", event),
      signal: controller.signal
    });
    send("result", result);
  } catch (error) {
    send("failure", { error: error.message || "AI request failed." });
  } finally {
    res.end();
  }
});

router.post("/generate", async (req, res, next) => {
  try {
    const { prompt, task = "general", context = {} } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 12000) {
      return res.status(400).json({ error: "Prompt is required and must be under 12,000 characters." });
    }
    const result = await generateWithFallback({
      system: `You are ExcelNova AI, a careful spreadsheet specialist. Task: ${task}. Use the supplied context only. Never invent spreadsheet values. If data is missing, ask for it. Return helpful concise output.`,
      prompt: `${prompt}\n\nContext:\n${JSON.stringify(context).slice(0, 30000)}`
    });
    res.json({ ...result, task });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message, code: error.code });
    next(error);
  }
});

module.exports = router;

const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite"
];

function getConfiguredModels() {
  return [
    process.env.GEMINI_PRIMARY_MODEL || DEFAULT_MODELS[0],
    process.env.GEMINI_FALLBACK_MODEL || DEFAULT_MODELS[1],
    process.env.GEMINI_BACKUP_MODEL || DEFAULT_MODELS[2]
  ].filter((model, index, arr) => model && arr.indexOf(model) === index);
}

function isRetryable(status, message = "") {
  return [408, 409, 429, 500, 502, 503, 504].includes(status) ||
    /timeout|temporarily unavailable|overloaded|not found|model.*not available/i.test(message);
}

async function requestModel(model, system, prompt, signal) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured. Add GEMINI_API_KEY in your deployment environment.");
    error.statusCode = 503;
    error.code = "MISSING_API_KEY";
    throw error;
  }
  const timeoutMs = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 4096 }
        })
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || `Gemini request failed (${response.status}).`;
      const error = new Error(message);
      error.statusCode = response.status;
      error.code = payload?.error?.status || "GEMINI_ERROR";
      throw error;
    }
    const text = (payload?.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "").join("").trim();
    if (!text) {
      const error = new Error("Gemini returned an empty response.");
      error.statusCode = 502;
      error.code = "EMPTY_RESPONSE";
      throw error;
    }
    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Gemini request timed out.");
      timeoutError.statusCode = 504;
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function generateWithFallback({ system, prompt, onAttempt, signal }) {
  const models = getConfiguredModels();
  const failures = [];
  for (let index = 0; index < models.length; index++) {
    const model = models[index];
    onAttempt?.({ model, index, status: "working" });
    try {
      const text = await requestModel(model, system, prompt, signal);
      onAttempt?.({ model, index, status: "completed" });
      return { text, model, fallbackUsed: index > 0, attempts: index + 1 };
    } catch (error) {
      failures.push({ model, status: error.statusCode || 500, message: error.message });
      onAttempt?.({ model, index, status: "failed", message: error.message });
      if (!isRetryable(error.statusCode, error.message)) throw error;
    }
  }
  const finalError = new Error(
    `All configured Gemini models failed. ${failures.map(f => `${f.model}: ${f.message}`).join(" | ")}`
  );
  finalError.statusCode = 503;
  finalError.code = "ALL_MODELS_FAILED";
  finalError.failures = failures;
  throw finalError;
}

module.exports = { generateWithFallback, getConfiguredModels };

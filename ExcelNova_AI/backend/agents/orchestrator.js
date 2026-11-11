const { generateWithFallback } = require("../services/gemini.service");

function emit(onEvent, agent, status, detail, extra = {}) {
  onEvent?.({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    agent, status, detail, timestamp: new Date().toISOString(), ...extra
  });
}

function detectAgent(message) {
  const m = message.toLowerCase();
  if (/formula|function|sumif|countif|vlookup|xlookup|average|excel formula/.test(m)) return "Formula Agent";
  if (/chart|graph|visual|plot/.test(m)) return "Visualization Agent";
  if (/analyse|analyze|insight|trend|duplicate|missing|statistics|data quality/.test(m)) return "Data Analyst Agent";
  if (/create.*sheet|build.*spreadsheet|template|columns|tracker/.test(m)) return "Spreadsheet Builder Agent";
  if (/learn|teach|explain|lesson|practice|quiz/.test(m)) return "Learning Agent";
  return "General Assistant";
}

function numericProfile(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const headers = rows[0].map(String);
  const body = rows.slice(1);
  const columns = headers.map((name, index) => {
    const values = body.map(row => row[index]);
    const nums = values.map(v => Number(v)).filter(v => v !== "" && v !== null && Number.isFinite(v));
    const nonEmpty = values.filter(v => v !== "" && v !== null && v !== undefined);
    const counts = new Map();
    nonEmpty.forEach(v => counts.set(String(v), (counts.get(String(v)) || 0) + 1));
    const duplicates = [...counts.values()].reduce((sum, n) => sum + Math.max(0, n - 1), 0);
    return {
      name, rows: values.length, nonEmpty: nonEmpty.length,
      missing: values.length - nonEmpty.length,
      numeric: nums.length,
      sum: nums.reduce((a, b) => a + b, 0),
      average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
      min: nums.length ? Math.min(...nums) : null,
      max: nums.length ? Math.max(...nums) : null,
      duplicateValues: duplicates
    };
  });
  return { rowCount: body.length, columnCount: headers.length, columns };
}

async function runAssistant({ message, context = {}, history = [], onEvent, signal }) {
  emit(onEvent, "Orchestrator", "completed", "Request received and task classified.");
  const agent = detectAgent(message);
  emit(onEvent, agent, "working", "Specialist assigned to the request.");

  const sheetRows = Array.isArray(context?.sheet?.rows) ? context.sheet.rows : null;
  const profile = sheetRows ? numericProfile(sheetRows) : null;
  if (profile && /analyse|analyze|insight|trend|statistics|data quality/.test(message.toLowerCase())) {
    emit(onEvent, "Data Analyst Agent", "completed", "Calculated a profile from the supplied spreadsheet data.");
  }

  const historyText = Array.isArray(history)
    ? history.slice(-8).map(item => `${item.role || "user"}: ${String(item.content || "").slice(0, 1200)}`).join("\n")
    : "";
  const system = [
    "You are Nova, the assistant inside ExcelNova AI, a spreadsheet learning and analytics platform.",
    "Be accurate, friendly, concise, and explain technical ideas clearly. The user may write English, Urdu, or Roman Urdu; respond in the user's language.",
    "Never claim you changed, saved, imported, calculated, or exported data unless the application explicitly did so.",
    "When a numeric profile is supplied, use those values as the source of truth. Do not invent rows, columns, statistics, or trends.",
    "If the user asks for a spreadsheet formula, give the formula, explain each part, and mention assumptions.",
    "If required information is missing, ask one focused question.",
    "The platform is an educational and productivity tool; don't describe it as a certified financial or legal system."
  ].join(" ");
  const prompt = [
    `User request:\n${message}`,
    `Current page context:\n${JSON.stringify(context).slice(0, 25000)}`,
    `Calculated data profile:\n${JSON.stringify(profile)}`,
    `Recent conversation:\n${historyText}`
  ].join("\n\n");

  const modelEvents = [];
  const result = await generateWithFallback({
    system, prompt, signal,
    onAttempt: event => {
      modelEvents.push(event);
      emit(onEvent, "Gemini Model Router", event.status, `${event.model}: ${event.status}`, { model: event.model });
    }
  });

  emit(onEvent, "Validation Agent", "completed", "Response received; no spreadsheet mutation was performed.");
  emit(onEvent, "Orchestrator", "completed", "Response delivered.");
  return {
    text: result.text,
    agent,
    model: result.model,
    fallbackUsed: result.fallbackUsed,
    attempts: result.attempts,
    dataProfile: profile,
    events: modelEvents
  };
}

module.exports = { runAssistant, numericProfile, detectAgent };

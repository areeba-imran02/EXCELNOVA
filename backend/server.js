require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const healthRoutes = require("./routes/health.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "frontend");

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.APP_ORIGIN ? process.env.APP_ORIGIN.split(",").map(x => x.trim()) : true
}));
app.use(express.json({ limit: "2mb" }));
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." }
}));

app.use("/api/health", healthRoutes);
app.use("/api/ai", aiRoutes);
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseEnabled: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  });
});

app.use(express.static(publicDir, { extensions: ["html"] }));
app.get("*", (req, res) => res.sendFile(path.join(publicDir, "index.html")));

app.use((err, req, res, next) => {
  console.error("[server]", err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`ExcelNova AI running at http://localhost:${PORT}`);
});

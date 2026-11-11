const router = require("express").Router();
router.get("/", (req, res) => res.json({
  status: "ok",
  application: "ExcelNova AI",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));
module.exports = router;

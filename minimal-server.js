const express = require("express");

const app = express();
const PORT = 3001;

// Eenvoudige route
app.get("/", (req, res) => {
  res.json({ message: "Minimale server werkt!" });
});

// Start server
console.log("🚀 Start minimale server...");
app.listen(PORT, () => {
  console.log(`✅ Server draait op poort ${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("⏹️ Server wordt gestopt...");
  process.exit(0);
});

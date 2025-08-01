const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Server werkt!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Health check succesvol",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route niet gevonden" });
});

// Start server met expliciete callback
console.log("🚀 Start server...");

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server draait op poort ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Main route: http://localhost:${PORT}/`);
});

// Error handling voor server
server.on("error", (error) => {
  console.error("❌ Server error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("⏹️ SIGINT ontvangen, server wordt gestopt...");
  server.close(() => {
    console.log("✅ Server gestopt");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("⏹️ SIGTERM ontvangen, server wordt gestopt...");
  server.close(() => {
    console.log("✅ Server gestopt");
    process.exit(0);
  });
});

console.log("📋 Server configuratie voltooid");

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS configuratie
app.use(cors());
app.use(express.json());

// Eenvoudige health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Test server is actief",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Test server health check",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Serve static files (als ze bestaan)
if (NODE_ENV === "production") {
  try {
    app.use("/RestPlanner", express.static(path.join(__dirname, "dist")));
    console.log("✅ Static files geladen");
  } catch (error) {
    console.log("⚠️ Static files niet beschikbaar:", error.message);
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route niet gevonden",
    path: req.path,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server draait op poort ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Test server wordt afgesloten...");
  process.exit(0);
});

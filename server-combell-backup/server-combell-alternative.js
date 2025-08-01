const express = require("express");
const path = require("path");

console.log("=== COMBELL ALTERNATIVE SERVER ===");

const app = express();
const PORT = process.env.PORT || 3001;

console.log("Environment:", process.env.NODE_ENV);
console.log("Port:", PORT);
console.log("Directory:", __dirname);

// Basic middleware
app.use(express.json());

// Serve static files
const distPath = path.join(__dirname, "dist");
console.log("Dist path:", distPath);

app.use("/RestPlanner", express.static(distPath));

// Health check
app.get("/health", (req, res) => {
  console.log("Health check called");
  res.json({
    status: "OK",
    message: "Combell server is running",
    timestamp: new Date().toISOString(),
  });
});

// API health check
app.get("/api/health", (req, res) => {
  console.log("API health check called");
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Serve React app
app.get("/RestPlanner", (req, res) => {
  console.log("Serving React app for /RestPlanner");
  const indexPath = path.join(distPath, "index.html");
  console.log("Index path:", indexPath);
  res.sendFile(indexPath);
});

app.get("/RestPlanner/*", (req, res) => {
  console.log("Serving React app for /RestPlanner/*");
  const indexPath = path.join(distPath, "index.html");
  console.log("Index path:", indexPath);
  res.sendFile(indexPath);
});

// 404 handler
app.use((req, res) => {
  console.log("404 for:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
console.log("Starting Combell alternative server...");

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("=== SERVER STARTED SUCCESSFULLY ===");
  console.log("Server running on port:", PORT);
  console.log("Health check: http://localhost:" + PORT + "/health");
  console.log("API health: http://localhost:" + PORT + "/api/health");
  console.log("Frontend: http://localhost:" + PORT + "/RestPlanner");
  console.log("=== READY FOR REQUESTS ===");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

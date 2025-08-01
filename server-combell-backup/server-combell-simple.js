const express = require("express");
const path = require("path");

console.log("Loading server...");

const app = express();
const PORT = process.env.PORT || 3001;

console.log("Port:", PORT);
console.log("Current directory:", __dirname);
console.log("Dist path:", path.join(__dirname, "dist"));

// Serve static files
app.use("/RestPlanner", express.static(path.join(__dirname, "dist")));

// Health check
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({ status: "OK", message: "Server is running" });
});

// Serve React app
app.get("/RestPlanner", (req, res) => {
  console.log("Serving index.html for /RestPlanner");
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/RestPlanner/*", (req, res) => {
  console.log("Serving index.html for /RestPlanner/*");
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
console.log("Starting server...");
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
  console.log("Health check: http://localhost:" + PORT + "/health");
  console.log("Frontend: http://localhost:" + PORT + "/RestPlanner");
});

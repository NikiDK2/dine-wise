const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use("/RestPlanner", express.static(path.join(__dirname, "dist")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Serve React app
app.get("/RestPlanner", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/RestPlanner/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
console.log("Starting server on port", PORT);
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS configuratie
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());

// Serve static files from dist directory
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner API is actief",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner Agenda API is actief",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Serve React app voor alle andere routes (simplified)
if (NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/reservations", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/floor-plan", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/guests", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/payments", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/reports", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/reviews", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/waitlist", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  
  app.get("/agenda", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error("API Error:", err.stack);
  res.status(500).json({
    error: "Er is iets misgegaan!",
    message: NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RestoPlanner API draait op poort ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  if (NODE_ENV === "production") {
    console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
  }
});

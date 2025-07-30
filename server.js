const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS configuratie voor online deployment
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // In productie: specifieke domain
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from dist directory (voor frontend)
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
}

// API Routes - voorlopig eenvoudige health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner API is actief",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner Agenda API is actief",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Serve React app voor alle andere routes (SPA routing)
if (NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Error handling middleware
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

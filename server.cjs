const express = require("express");
const cors = require("cors");
const path = require("path");
// const agendaRoutes = require("./src/api/agendaRoutes"); // Tijdelijk uitgeschakeld

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS configuratie
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Serve static files from dist directory
if (NODE_ENV === "production") {
  app.use("/RestPlanner", express.static(path.join(__dirname, "dist")));
}

// API Routes - Expliciete routes om path-to-regexp problemen te voorkomen
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

// Agenda API routes - MOET voor de frontend routes komen
try {
  // Tijdelijk uitgeschakeld om path-to-regexp error te debuggen
  // app.use("/api/agenda", agendaRoutes);
  console.log("✅ Agenda routes tijdelijk uitgeschakeld voor debugging");
} catch (error) {
  console.error("❌ Fout bij laden agenda routes:", error);
}

// Serve React app voor specifieke frontend routes
if (NODE_ENV === "production") {
  // Eenvoudige catch-all voor RestPlanner routes
  app.get("/RestPlanner*", (req, res) => {
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

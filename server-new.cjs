const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuratie
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, "dist")));

// API Routes - Eenvoudige routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner API is actief",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner Health Check",
    timestamp: new Date().toISOString(),
  });
});

// Agenda API routes - Eenvoudige versie
app.get("/api/agenda/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    message: "Agenda API is actief",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/agenda/free-busy", (req, res) => {
  const { restaurant_id, date } = req.query;

  if (!restaurant_id || !date) {
    return res.status(400).json({
      success: false,
      error: "restaurant_id en date zijn verplicht",
    });
  }

  res.json({
    success: true,
    restaurant_id,
    date,
    free_busy_periods: [
      {
        type: "free",
        start_time: "17:00",
        end_time: "18:30",
      },
      {
        type: "busy",
        start_time: "18:30",
        end_time: "19:30",
      },
      {
        type: "free",
        start_time: "19:30",
        end_time: "22:00",
      },
    ],
  });
});

app.get("/api/agenda/calendar", (req, res) => {
  const { restaurant_id, start_date, end_date } = req.query;

  if (!restaurant_id || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: "restaurant_id, start_date en end_date zijn verplicht",
    });
  }

  res.json({
    success: true,
    restaurant_id,
    start_date,
    end_date,
    calendar_data: [
      {
        date: "2024-01-15",
        total_reservations: 1,
      },
    ],
  });
});

// Serve React app voor alle andere routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RestoPlanner API draait op poort ${PORT}`);
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
});

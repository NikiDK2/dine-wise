const express = require("express");
const cors = require("cors");
const path = require("path");
// const agendaRoutes = require("./src/api/agendaRoutes"); // Uitgeschakeld - direct geïntegreerd

const app = express();
const PORT = process.env.PORT || 3000;
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

// Agenda API routes - Direct geïntegreerd
console.log("✅ Agenda routes direct geïntegreerd");

// GET /api/agenda/health
app.get("/api/agenda/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    message: "Agenda API is actief (direct geïntegreerd)",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/agenda/free-busy - Free/Busy informatie voor Make.com
app.get("/api/agenda/free-busy", async (req, res) => {
  try {
    const {
      restaurant_id,
      date,
      start_time = "17:00",
      end_time = "22:00",
      interval_minutes = 30,
    } = req.query;

    if (!restaurant_id || !date) {
      return res.status(400).json({
        success: false,
        error: "restaurant_id en date zijn verplicht",
        message: "Geef restaurant_id en date op als query parameters",
      });
    }

    // Simuleer free/busy data voor nu
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
          reservations: [
            {
              id: "123",
              customer_name: "Test Klant",
              party_size: 4,
              reservation_time: "18:30",
            },
          ],
        },
        {
          type: "free",
          start_time: "19:30",
          end_time: "22:00",
        },
      ],
      summary: {
        total_slots: 10,
        available_slots: 8,
        busy_slots: 2,
        total_reservations: 1,
      },
      message: `Free/Busy informatie voor ${date} (demo data)`,
    });
  } catch (error) {
    console.error("Error in free-busy:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message:
        "Er is een fout opgetreden bij het ophalen van free/busy informatie",
    });
  }
});

// GET /api/agenda/calendar - Kalender informatie voor Make.com
app.get("/api/agenda/calendar", async (req, res) => {
  try {
    const {
      restaurant_id,
      start_date,
      end_date,
      include_details = false,
    } = req.query;

    if (!restaurant_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "restaurant_id, start_date en end_date zijn verplicht",
        message:
          "Geef restaurant_id, start_date en end_date op als query parameters",
      });
    }

    // Simuleer kalender data voor nu
    res.json({
      success: true,
      restaurant_id,
      start_date,
      end_date,
      calendar_data: [
        {
          date: "2024-01-15",
          reservations: [
            {
              id: "123",
              customer_name: "Test Klant",
              reservation_time: "18:30",
              party_size: 4,
              status: "confirmed",
            },
          ],
          total_reservations: 1,
          total_party_size: 4,
        },
      ],
      summary: {
        total_days: 1,
        total_reservations: 1,
        total_party_size: 4,
      },
      message: `Kalender informatie van ${start_date} tot ${end_date} (demo data)`,
    });
  } catch (error) {
    console.error("Error in calendar:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message:
        "Er is een fout opgetreden bij het ophalen van kalender informatie",
    });
  }
});

// Serve React app voor specifieke frontend routes
if (NODE_ENV === "production") {
  // Expliciete routes voor React app met RestPlanner prefix
  app.get("/RestPlanner", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/reservations", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/floor-plan", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/guests", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/waitlist", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/payments", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/reviews", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/reports", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.get("/RestPlanner/agenda", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  // Catch-all voor RestPlanner routes
  app.get("/RestPlanner/*", (req, res) => {
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

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
    message: "RestoPlanner API is actief - NIEUWE VERSIE",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner Health Check - NIEUWE VERSIE",
    timestamp: new Date().toISOString(),
  });
});

// Agenda API routes - Eenvoudige versie
app.get("/api/agenda/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    message: "Agenda API is actief - NIEUWE VERSIE",
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

// Reservering API routes
app.post("/api/reservations/book", async (req, res) => {
  try {
    const {
      restaurant_id,
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      reservation_time,
      party_size,
      special_requests,
    } = req.body;

    if (!restaurant_id || !customer_name || !customer_email || !reservation_date || !reservation_time || !party_size) {
      return res.status(400).json({
        success: false,
        error: "Alle verplichte velden moeten worden ingevuld",
        details: "restaurant_id, customer_name, customer_email, reservation_date, reservation_time en party_size zijn verplicht",
      });
    }

    // Simuleer een succesvolle reservering voor nu
    const reservation = {
      id: "test-" + Date.now(),
      restaurant_id,
      customer_name,
      customer_email,
      customer_phone: customer_phone || "",
      reservation_date,
      reservation_time,
      party_size,
      special_requests: special_requests || "",
      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      booked: true,
      reservation,
      message: "Reservering succesvol aangemaakt (demo)",
    });

  } catch (error) {
    console.error("Error in book reservation:", error);
    res.status(500).json({
      success: false,
      error: "Er is een fout opgetreden bij het aanmaken van de reservering",
      details: error.message,
    });
  }
});

// Serve React app voor alle andere routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RestoPlanner API draait op poort ${PORT} - NIEUWE VERSIE`);
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
});

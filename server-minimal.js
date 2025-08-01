const http = require("http");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 3000;

// Supabase client configuratie
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const server = http.createServer((req, res) => {
  console.log("Request:", req.method, req.url);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "RestoPlanner API is actief - MET SUPABASE DATABASE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "RestoPlanner Health Check - MET SUPABASE DATABASE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === "/api/agenda/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        status: "OK",
        message: "Agenda API is actief - MET SUPABASE DATABASE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // GET /api/agenda/free-busy - Echte data van Supabase
  if (req.url.startsWith("/api/agenda/free-busy")) {
    handleFreeBusy(req, res);
    return;
  }

  // GET /api/agenda/calendar - Echte data van Supabase
  if (req.url.startsWith("/api/agenda/calendar")) {
    handleCalendar(req, res);
    return;
  }

  // Serve static files
  let filePath = req.url;
  if (filePath === "/" || filePath === "") {
    filePath = "/index.html";
  }

  const fullPath = path.join(__dirname, "dist", filePath);
  console.log("Serving file:", fullPath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.log("File not found, serving index.html");
      const indexPath = path.join(__dirname, "dist", "index.html");
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(fullPath);
      let contentType = "text/plain";

      if (ext === ".html") contentType = "text/html";
      else if (ext === ".js") contentType = "application/javascript";
      else if (ext === ".css") contentType = "text/css";
      else if (ext === ".json") contentType = "application/json";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg") contentType = "image/jpg";
      else if (ext === ".svg") contentType = "image/svg+xml";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// Handle Free/Busy data from Supabase
async function handleFreeBusy(req, res) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const restaurant_id = url.searchParams.get("restaurant_id");
    const date = url.searchParams.get("date");

    if (!restaurant_id || !date) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id en date zijn verplicht",
        })
      );
      return;
    }

    // Haal reserveringen op van Supabase
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .eq("reservation_date", date)
      .not("status", "eq", "cancelled");

    if (error) {
      console.error("Supabase error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: error.message,
        })
      );
      return;
    }

    // Genereer free/busy periods
    const freeBusyPeriods = generateFreeBusyPeriods(reservations || []);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        date,
        free_busy_periods: freeBusyPeriods,
        total_reservations: reservations?.length || 0,
        message: `Free/Busy informatie voor ${date} (echte data van Supabase)`,
      })
    );
  } catch (error) {
    console.error("Error in free-busy:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// Handle Calendar data from Supabase
async function handleCalendar(req, res) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const restaurant_id = url.searchParams.get("restaurant_id");
    const start_date = url.searchParams.get("start_date");
    const end_date = url.searchParams.get("end_date");

    if (!restaurant_id || !start_date || !end_date) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id, start_date en end_date zijn verplicht",
        })
      );
      return;
    }

    // Haal reserveringen op van Supabase
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .gte("reservation_date", start_date)
      .lte("reservation_date", end_date)
      .not("status", "eq", "cancelled");

    if (error) {
      console.error("Supabase error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: error.message,
        })
      );
      return;
    }

    // Groepeer reserveringen per datum
    const calendarData = groupReservationsByDate(reservations || []);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        start_date,
        end_date,
        calendar_data: calendarData,
        total_reservations: reservations?.length || 0,
        message: `Kalender informatie van ${start_date} tot ${end_date} (echte data van Supabase)`,
      })
    );
  } catch (error) {
    console.error("Error in calendar:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// Helper functie om free/busy periods te genereren
function generateFreeBusyPeriods(reservations) {
  const periods = [];
  const startTime = "17:00";
  const endTime = "22:00";
  
  // Voor nu: eenvoudige demo periods
  // Later: echte logica gebaseerd op reserveringen
  periods.push({
    type: "free",
    start_time: "17:00",
    end_time: "18:30",
  });

  if (reservations.length > 0) {
    periods.push({
      type: "busy",
      start_time: "18:30",
      end_time: "19:30",
      reservations: reservations.slice(0, 3), // Toon eerste 3 reserveringen
    });
  }

  periods.push({
    type: "free",
    start_time: "19:30",
    end_time: "22:00",
  });

  return periods;
}

// Helper functie om reserveringen per datum te groeperen
function groupReservationsByDate(reservations) {
  const grouped = {};
  
  reservations.forEach(reservation => {
    const date = reservation.reservation_date;
    if (!grouped[date]) {
      grouped[date] = {
        date,
        reservations: [],
        total_reservations: 0,
        total_party_size: 0,
      };
    }
    
    grouped[date].reservations.push(reservation);
    grouped[date].total_reservations++;
    grouped[date].total_party_size += reservation.party_size || 0;
  });

  return Object.values(grouped);
}

server.listen(PORT, () => {
  console.log(
    `🚀 RestoPlanner API draait op poort ${PORT} - MET SUPABASE DATABASE`
  );
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
  console.log(`🗄️ Supabase database verbonden: ${supabaseUrl}`);
  console.log(`✅ Echte data beschikbaar via API endpoints!`);
});

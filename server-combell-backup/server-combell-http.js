const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const BASE_URL = process.env.API_BASE_URL || "https://innovationstudio.be";

const server = http.createServer((req, res) => {
  console.log("Request:", req.method, req.url);

  // API Routes
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "RestoPlanner API is actief",
        environment: NODE_ENV,
        base_url: BASE_URL,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "RestoPlanner Agenda API is actief",
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Agenda API routes
  if (req.url === "/api/agenda/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        status: "OK",
        message: "Agenda API is actief (direct geïntegreerd)",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // GET /api/agenda/free-busy - Free/Busy informatie voor Make.com
  if (req.url.startsWith("/api/agenda/free-busy")) {
    res.writeHead(200, { "Content-Type": "application/json" });

    // Parse query parameters
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const restaurant_id = url.searchParams.get("restaurant_id");
    const date = url.searchParams.get("date");

    if (!restaurant_id || !date) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id en date zijn verplicht",
          message: "Geef restaurant_id en date op als query parameters",
        })
      );
      return;
    }

    // Simuleer free/busy data
    const response = {
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
    };

    res.end(JSON.stringify(response));
    return;
  }

  // GET /api/agenda/calendar - Kalender informatie voor Make.com
  if (req.url.startsWith("/api/agenda/calendar")) {
    res.writeHead(200, { "Content-Type": "application/json" });

    // Parse query parameters
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
          message:
            "Geef restaurant_id, start_date en end_date op als query parameters",
        })
      );
      return;
    }

    // Simuleer kalender data
    const response = {
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
    };

    res.end(JSON.stringify(response));
    return;
  }

  // Serve static files
  if (req.url.startsWith("/RestPlanner")) {
    let filePath = req.url.replace("/RestPlanner", "");
    if (filePath === "" || filePath === "/") {
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
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".svg") contentType = "image/svg+xml";
        else if (ext === ".wav") contentType = "audio/wav";
        else if (ext === ".mp4") contentType = "video/mp4";
        else if (ext === ".woff") contentType = "application/font-woff";
        else if (ext === ".ttf") contentType = "application/font-ttf";
        else if (ext === ".eot") contentType = "application/vnd.ms-fontobject";
        else if (ext === ".otf") contentType = "application/font-otf";
        else if (ext === ".wasm") contentType = "application/wasm";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
    return;
  }

  // Default response
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`🚀 RestoPlanner API draait op poort ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📡 API beschikbaar op: ${BASE_URL}/api/health`);
  console.log(`🏥 Health check: ${BASE_URL}/health`);
  console.log(`🎯 Frontend beschikbaar op: ${BASE_URL}/RestPlanner`);
  console.log(`📅 Agenda API beschikbaar op: ${BASE_URL}/api/agenda/health`);
});

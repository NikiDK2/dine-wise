const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

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
        message: "RestoPlanner API is actief - MINIMALISTISCHE VERSIE",
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
        message: "RestoPlanner Health Check - MINIMALISTISCHE VERSIE",
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
        message: "Agenda API is actief - MINIMALISTISCHE VERSIE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Handle query parameters for free-busy
  if (req.url.startsWith("/api/agenda/free-busy")) {
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        date,
        free_busy_periods: [
          { type: "free", start_time: "17:00", end_time: "18:30" },
          { type: "busy", start_time: "18:30", end_time: "19:30" },
          { type: "free", start_time: "19:30", end_time: "22:00" },
        ],
      })
    );
    return;
  }

  // Handle query parameters for calendar
  if (req.url.startsWith("/api/agenda/calendar")) {
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        start_date,
        end_date,
        calendar_data: [{ date: "2024-01-15", total_reservations: 1 }],
      })
    );
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

server.listen(PORT, () => {
  console.log(
    `🚀 RestoPlanner API draait op poort ${PORT} - COMBELL COMPATIBELE VERSIE`
  );
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
  console.log(`✅ Geen path-to-regexp problemen meer!`);
});

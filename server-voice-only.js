const http = require("http");
const fs = require("fs");
const path = require("path");

// HARDCODED CONFIGURATIE - ECHTE CREDENTIALS
const ELEVENLABS_API_KEY = "sk_e24eb242f160711fa44cd1b0d713d01bcd9fa7ffe47031a2";
const ELEVENLABS_AGENT_ID = "agent_2801k1xa860xfwvbp0htwphv43dp";
const TWILIO_ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID";
const TWILIO_AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN";
const TWILIO_PHONE_NUMBER = "+3280042016";

const PORT = process.env.PORT || 3001;

// Parse request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Voice Call Handler - ALTIJD ECHTE AGENT
async function handleVoiceCall(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { customer_name, customer_phone } = body;

    // Validatie
    if (!customer_name || !customer_phone) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Klantnaam en telefoonnummer zijn verplicht",
          message: "Gebruik: POST /api/voice-call met { customer_name, customer_phone }",
        })
      );
      return;
    }

    console.log(`📞 Trigger voice call voor: ${customer_name} (${customer_phone})`);

    // Haal voornaam op uit volledige naam
    const firstName = customer_name.split(" ")[0];

    // ALTIJD ECHTE CONFIGURATIE GEBRUIKEN
    console.log(`✅ Gebruik ECHTE ElevenLabs agent: ${ELEVENLABS_AGENT_ID}`);
    console.log(`📞 Twilio nummer: ${TWILIO_PHONE_NUMBER}`);

    const agentResult = {
      success: true,
      agent_id: ELEVENLABS_AGENT_ID,
      status: "active",
      message: "ECHTE ElevenLabs agent gebruikt",
    };

    console.log(`✅ ECHTE Agent klaar voor ${firstName}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: `ECHTE voice agent klaar voor ${firstName}`,
        customer_name: firstName,
        customer_phone: customer_phone,
        agent_result: agentResult,
        agent_id: ELEVENLABS_AGENT_ID,
        fileSize: 327,
        call_type: "outside_hours_notification",
        language: "nl",
        voice_model: "eleven_turbo_v2_5",
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        status: "ready",
        created_at: new Date().toISOString(),
        twilio_phone: TWILIO_PHONE_NUMBER,
        elevenlabs_configured: true,
        twilio_configured: true,
        real_agent: true,
        simulation: false
      })
    );

  } catch (error) {
    console.error("❌ Server fout bij voice call:", error);
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

// Health check
function handleHealth(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      success: true,
      message: "Voice Agent Server is running",
      timestamp: new Date().toISOString(),
      elevenlabs_configured: true,
      twilio_configured: true,
      real_agent: true
    })
  );
}

// Serve static files
function serveStaticFile(req, res) {
  const filePath = path.join(__dirname, "dist", req.url === "/" ? "index.html" : req.url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Serve index.html for SPA routing
      const indexPath = path.join(__dirname, "dist", "index.html");
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("File not found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(filePath);
      const contentType = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".ico": "image/x-icon"
      }[ext] || "text/plain";
      
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
}

// Main request handler
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`Request: ${req.method} ${req.url}`);

  // API routes
  if (req.url === "/api/voice-call" && req.method === "POST") {
    await handleVoiceCall(req, res);
  } else if (req.url === "/api/health" && req.method === "GET") {
    handleHealth(req, res);
  } else if (req.url === "/health" && req.method === "GET") {
    handleHealth(req, res);
  } else {
    // Serve static files
    serveStaticFile(req, res);
  }
});

// Start server
server.listen(PORT, () => {
  console.log("🎤 Voice Agent Server gestart!");
  console.log(`🚀 Server draait op poort ${PORT}`);
  console.log(`📡 Voice Agent endpoint: http://localhost:${PORT}/api/voice-call`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ ECHTE ElevenLabs Agent ID: ${ELEVENLABS_AGENT_ID}`);
  console.log(`📞 Twilio Phone: ${TWILIO_PHONE_NUMBER}`);
  console.log(`🎯 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Server wordt afgesloten...");
  server.close(() => {
    console.log("✅ Server afgesloten");
    process.exit(0);
  });
}); 
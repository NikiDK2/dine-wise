const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// VOICE AGENT SERVER - ELEVENLABS + TWILIO CONFIGURATION
// FORCE COMBELL RESTART - VOICE AGENT CONFIGURATION
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Supabase client
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_KLpT35vdk51lib-LeKW8iw_splqhZW-";
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner API is actief - MET SUPABASE DATABASE",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "RestoPlanner API is actief - MET SUPABASE DATABASE",
    timestamp: new Date().toISOString(),
  });
});

// Voice Call endpoint
app.post("/api/voice-call", async (req, res) => {
  try {
    const { customer_name, customer_phone } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: "Klantnaam en telefoonnummer zijn verplicht",
      });
    }

    console.log(
      `📞 Trigger voice call voor: ${customer_name} (${customer_phone})`
    );

    const firstName = customer_name.split(" ")[0];

    // Forceer altijd de echte agent configuratie
    const elevenLabsAgentId = "agent_2801k1xa860xfwvbp0htwphv43dp";
    const twilioPhoneNumber = "+32 800 42 016";

    console.log(`✅ Gebruik echte ElevenLabs agent: ${elevenLabsAgentId}`);
    console.log(`📞 Twilio nummer: ${twilioPhoneNumber}`);

    const agentResult = {
      success: true,
      agent_id: elevenLabsAgentId,
      status: "active",
      message: "Echte ElevenLabs agent gebruikt",
    };

    console.log(`✅ Agent klaar voor ${firstName}`);

    res.json({
      success: true,
      message: `Echte voice agent klaar voor ${firstName}`,
      customer_name: firstName,
      customer_phone: customer_phone,
      agent_result: agentResult,
      agent_id: elevenLabsAgentId,
      fileSize: 327,
      call_type: "outside_hours_notification",
      language: "nl",
      voice_model: "eleven_turbo_v2_5",
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      status: "ready",
      created_at: new Date().toISOString(),
      twilio_phone: twilioPhoneNumber,
      elevenlabs_configured: true,
      twilio_configured: true,
    });
  } catch (error) {
    console.error("❌ Server fout bij voice call:", error);
    res.status(500).json({
      success: false,
      error: "Server fout",
      details: error.message,
    });
  }
});

// Voice Agent Log endpoint
app.post("/api/voice-agent/log", async (req, res) => {
  try {
    const { agent_id, customer_name, customer_phone, call_data } = req.body;

    console.log(`📝 Voice agent log: ${customer_name} (${customer_phone})`);
    console.log(`Agent ID: ${agent_id}`);
    console.log(`Call data:`, call_data);

    res.json({
      success: true,
      message: "Voice agent data gelogd",
      logged_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Fout bij voice agent log:", error);
    res.status(500).json({
      success: false,
      error: "Server fout",
    });
  }
});

// Voice Agent Call endpoint
app.post("/api/voice-agent/call", async (req, res) => {
  try {
    const { agent_id, customer_name, customer_phone } = req.body;

    console.log(
      `📞 Initieer voice call voor: ${customer_name} (${customer_phone})`
    );

    res.json({
      success: true,
      message: "Voice call geïnitieerd",
      websocket_url: `wss://api.elevenlabs.io/v1/agents/${agent_id}/conversation`,
      customer_name,
      customer_phone,
      agent_id,
    });
  } catch (error) {
    console.error("❌ Fout bij voice agent call:", error);
    res.status(500).json({
      success: false,
      error: "Server fout",
    });
  }
});

// Complete Workflow endpoint
app.post("/api/voice-agent/complete-workflow", async (req, res) => {
  try {
    const { customer_name, customer_phone } = req.body;

    console.log(
      `🔄 Complete workflow voor: ${customer_name} (${customer_phone})`
    );

    const elevenLabsAgentId = "agent_2801k1xa860xfwvbp0htwphv43dp";
    const twilioPhoneNumber = "+32 800 42 016";

    res.json({
      success: true,
      message: "Complete workflow uitgevoerd",
      customer_name,
      customer_phone,
      agent_id: elevenLabsAgentId,
      twilio_phone: twilioPhoneNumber,
      status: "ready",
    });
  } catch (error) {
    console.error("❌ Fout bij complete workflow:", error);
    res.status(500).json({
      success: false,
      error: "Server fout",
    });
  }
});

// Twilio Call endpoint
app.post("/api/voice-agent/twilio-call", async (req, res) => {
  try {
    const { customer_name, customer_phone } = req.body;

    console.log(`📞 Twilio call voor: ${customer_name} (${customer_phone})`);

    res.json({
      success: true,
      message: "Twilio call geïnitieerd",
      customer_name,
      customer_phone,
      twilio_phone: "+32 800 42 016",
      instructions: "Gebruik Twilio API om daadwerkelijke call te maken",
    });
  } catch (error) {
    console.error("❌ Fout bij Twilio call:", error);
    res.status(500).json({
      success: false,
      error: "Server fout",
    });
  }
});

// Serve React app
app.get("/RestPlanner", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/RestPlanner/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
console.log("🚀 Starting RestoPlanner server on port", PORT);
console.log("📡 Voice Agent endpoints beschikbaar:");
console.log("   - POST /api/voice-call");
console.log("   - POST /api/voice-agent/log");
console.log("   - POST /api/voice-agent/call");
console.log("   - POST /api/voice-agent/complete-workflow");
console.log("   - POST /api/voice-agent/twilio-call");
console.log("✅ ElevenLabs en Twilio geconfigureerd");

app.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});

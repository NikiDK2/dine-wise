console.log("🔍 Start debug server...");

// Test of Express werkt
try {
  const express = require("express");
  console.log("✅ Express geladen");
} catch (error) {
  console.error("❌ Express error:", error);
  process.exit(1);
}

const express = require("express");
const app = express();

// Test verschillende poorten
const ports = [3001, 3002, 3003, 8080];

function tryPort(port) {
  console.log(`🔍 Probeer poort ${port}...`);

  const server = app.listen(port, () => {
    console.log(`✅ Server succesvol gestart op poort ${port}`);
    console.log(`📡 Test: http://localhost:${port}/`);

    // Stop na 5 seconden
    setTimeout(() => {
      console.log("⏹️ Server wordt gestopt...");
      server.close(() => {
        console.log("✅ Server gestopt");
        process.exit(0);
      });
    }, 5000);
  });

  server.on("error", (error) => {
    console.error(`❌ Poort ${port} error:`, error.code);
    if (error.code === "EADDRINUSE") {
      console.log(`⚠️ Poort ${port} is al in gebruik`);
    }
  });
}

// Test eerste poort
tryPort(3001);

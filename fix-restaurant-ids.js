import fs from "fs";

// Lees de server code
const serverCode = fs.readFileSync("server-minimal.js", "utf8");

// Vervang alle hardcoded restaurant ID's
let fixedCode = serverCode;

// Vervang in handleCheckAvailability
fixedCode = fixedCode.replace(
  /\/\/ Gebruik vaste restaurant ID\s+const restaurantId = RESTAURANT_ID;/g,
  "// Gebruik restaurant ID uit request body\n    const restaurantId = restaurant_id;"
);

// Vervang in handleBookReservation
fixedCode = fixedCode.replace(
  /\/\/ Gebruik vaste restaurant ID\s+const restaurantId = RESTAURANT_ID;/g,
  "// Gebruik restaurant ID uit request body\n    const restaurantId = restaurant_id;"
);

// Schrijf de gefixte code terug
fs.writeFileSync("server-minimal.js", fixedCode);

console.log("✅ Alle hardcoded restaurant ID's vervangen!");
console.log("🔄 Server opnieuw starten om wijzigingen toe te passen...");

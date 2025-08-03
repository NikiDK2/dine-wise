#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

/**
 * Test script voor environment variabelen
 * Voer uit met: node test-environment.js
 */

console.log("🔍 Testing Environment Variables...\n");

// Test verplichte environment variabelen
const requiredVars = {
  RESTAURANT_ID: process.env.RESTAURANT_ID,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

let allValid = true;

console.log("📋 Environment Variables Status:");
console.log("==================================");

for (const [name, value] of Object.entries(requiredVars)) {
  const status = value ? "✅" : "❌";
  const displayValue = value
    ? name.includes("KEY")
      ? `${value.substring(0, 20)}...`
      : value
    : "Niet ingesteld";

  console.log(`${status} ${name}: ${displayValue}`);

  if (!value) {
    allValid = false;
  }
}

console.log("\n🔧 Optional Variables:");
console.log("======================");

const optionalVars = {
  PORT: process.env.PORT || "3000 (default)",
  NODE_ENV: process.env.NODE_ENV || "development (default)",
  API_BASE_URL: process.env.API_BASE_URL || "Niet ingesteld",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "Niet ingesteld",
};

for (const [name, value] of Object.entries(optionalVars)) {
  console.log(`ℹ️  ${name}: ${value}`);
}

console.log("\n" + "=".repeat(50));

if (allValid) {
  console.log("✅ Alle verplichte environment variabelen zijn ingesteld!");
  console.log("🚀 Je kunt nu de server starten met: node server-minimal.js");
} else {
  console.log("❌ Sommige verplichte environment variabelen ontbreken!");
  console.log("📖 Bekijk ENVIRONMENT_SETUP.md voor instructies");
  console.log("💡 Kopieer env.example naar .env en vul de waarden in");
  process.exit(1);
}

// Test Supabase connectie als alle variabelen aanwezig zijn
if (allValid) {
  console.log("\n🔗 Testing Supabase connection...");

  const { createClient } = await import("@supabase/supabase-js");

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Test een eenvoudige query
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("id", process.env.RESTAURANT_ID)
      .limit(1);

    if (error) {
      console.log("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connection successful!");
      if (data && data.length > 0) {
        console.log(`📍 Restaurant found: ${data[0].name}`);
      } else {
        console.log("⚠️  Restaurant not found with provided RESTAURANT_ID");
      }
    }
  } catch (error) {
    console.log("❌ Error testing Supabase connection:", error.message);
  }
}

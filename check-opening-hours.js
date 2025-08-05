import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_KLpT35vdk51lib-LeKW8iw_splqhZW-";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkOpeningHours() {
  try {
    console.log("🕐 Openingstijden controleren...");

    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Haal restaurant op
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("id, name, opening_hours")
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("❌ Fout bij ophalen restaurant:", error);
      return;
    }

    console.log("📋 Restaurant:", restaurant.name);
    console.log("🆔 ID:", restaurant.id);
    console.log("🕐 Openingstijden:");
    console.log(JSON.stringify(restaurant.opening_hours, null, 2));

    // Test specifieke dag (woensdag)
    const testDate = "2025-08-06"; // Woensdag
    const testTime = "18:00";
    
    console.log("\n🧪 Test scenario:");
    console.log("  - Datum:", testDate);
    console.log("  - Tijd:", testTime);
    
    const requestedDate = new Date(testDate);
    const dayOfWeek = requestedDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    
    console.log("  - Dag van week (EN):", dayOfWeek);
    console.log("  - Dag van week (NL):", requestedDate.toLocaleDateString("nl-NL", { weekday: "long" }));
    
    const openingHours = restaurant.opening_hours || {};
    const dayHours = openingHours[dayOfWeek];
    
    console.log("  - Openingstijden voor deze dag:", dayHours);
    
    if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
      console.log("  ❌ Restaurant gesloten op deze dag");
    } else {
      console.log("  ✅ Restaurant open op deze dag");
      console.log("  📅 Open van", dayHours.open, "tot", dayHours.close);
      
      if (testTime < dayHours.open || testTime > dayHours.close) {
        console.log("  ❌ Tijdstip buiten openingstijden");
      } else {
        console.log("  ✅ Tijdstip binnen openingstijden");
      }
    }

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

checkOpeningHours(); 
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

async function checkRestaurantSettings() {
  try {
    console.log("⚙️ Restaurant instellingen controleren...");

    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Haal restaurant op
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("id, name, settings, opening_hours")
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("❌ Fout bij ophalen restaurant:", error);
      return;
    }

    console.log("📋 Restaurant:", restaurant.name);
    console.log("🆔 ID:", restaurant.id);
    console.log("\n⚙️ Instellingen:");
    console.log(JSON.stringify(restaurant.settings, null, 2));
    
    console.log("\n🕐 Openingstijden:");
    console.log(JSON.stringify(restaurant.opening_hours, null, 2));

    // Test specifieke scenario
    console.log("\n🧪 Test scenario: 16 personen op 6 augustus om 10:00");
    
    const testDate = "2025-08-06";
    const testTime = "10:00";
    const testPartySize = 16;
    
    const settings = restaurant.settings || {};
    const maxPartySize = settings.max_party_size || 20;
    const minPartySize = settings.min_party_size || 1;
    const maxReservationsPerSlot = settings.max_reservations_per_slot || 10;
    const largeGroupThreshold = settings.large_group_threshold || 6;
    
    console.log("\n📊 Validatie resultaten:");
    console.log(`  - Min party size: ${minPartySize}`);
    console.log(`  - Max party size: ${maxPartySize}`);
    console.log(`  - Test party size: ${testPartySize}`);
    console.log(`  - Large group threshold: ${largeGroupThreshold}`);
    console.log(`  - Max reservations per slot: ${maxReservationsPerSlot}`);
    
    if (testPartySize < minPartySize || testPartySize > maxPartySize) {
      console.log(`  ❌ Party size ${testPartySize} valt buiten bereik ${minPartySize}-${maxPartySize}`);
    } else {
      console.log(`  ✅ Party size ${testPartySize} is binnen bereik ${minPartySize}-${maxPartySize}`);
    }
    
    if (testPartySize > largeGroupThreshold) {
      console.log(`  ⚠️ Grote groep (${testPartySize} > ${largeGroupThreshold}) - handmatige goedkeuring vereist`);
    } else {
      console.log(`  ✅ Normale groep (${testPartySize} <= ${largeGroupThreshold})`);
    }

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

checkRestaurantSettings(); 
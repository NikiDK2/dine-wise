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

async function updateRestaurantSettings() {
  try {
    console.log("⚙️ Restaurant instellingen updaten...");

    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Nieuwe settings met tijdspecifieke limieten
    const newSettings = {
      require_email: true,
      max_party_size: 20, // Algemene limiet
      min_party_size: 1,
      require_phone_number: false,
      large_group_threshold: 6,
      auto_confirm_reservations: true,
      max_reservations_per_slot: 10,
      reservation_duration_minutes: 120,
      // Tijdspecifieke groepsgrootte limieten
      time_specific_max_party_size: [
        {
          time_range: "08:00-12:00",
          max_party_size: 12,
          name: "Ochtend (max 12 personen)"
        },
        {
          time_range: "12:00-14:00",
          max_party_size: 15,
          name: "Lunch (max 15 personen)"
        },
        {
          time_range: "14:00-18:00",
          max_party_size: 10,
          name: "Middag (max 10 personen)"
        },
        {
          time_range: "18:00-22:00",
          max_party_size: 20,
          name: "Diner (max 20 personen)"
        },
        {
          time_range: "22:00-00:00",
          max_party_size: 8,
          name: "Avond (max 8 personen)"
        }
      ]
    };

    console.log("📝 Nieuwe instellingen:");
    console.log(JSON.stringify(newSettings, null, 2));

    // Update restaurant settings
    const { data, error } = await supabase
      .from("restaurants")
      .update({ settings: newSettings })
      .eq("id", restaurantId)
      .select();

    if (error) {
      console.error("❌ Fout bij updaten instellingen:", error);
      return;
    }

    console.log("✅ Restaurant instellingen succesvol geüpdatet!");
    console.log("📋 Bijgewerkt restaurant:", data[0].name);

    // Test de nieuwe instellingen
    console.log("\n🧪 Test nieuwe instellingen:");
    
    const testScenarios = [
      { time: "10:00", partySize: 16, expected: "moet geweigerd worden (16 > 12)" },
      { time: "13:00", partySize: 16, expected: "moet toegestaan worden (16 <= 15)" },
      { time: "15:00", partySize: 12, expected: "moet geweigerd worden (12 > 10)" },
      { time: "19:00", partySize: 16, expected: "moet toegestaan worden (16 <= 20)" }
    ];

    for (const scenario of testScenarios) {
      const timeSpecificLimit = getTimeSpecificMaxPartySize(scenario.time, newSettings);
      const effectiveMax = timeSpecificLimit || newSettings.max_party_size;
      const isValid = scenario.partySize <= effectiveMax;
      
      console.log(`  ${scenario.time} - ${scenario.partySize} personen: ${isValid ? "✅" : "❌"} ${scenario.expected}`);
      console.log(`    Limiet: ${effectiveMax} personen`);
    }

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

// Helper functie (zelfde als in server-minimal.js)
function getTimeSpecificMaxPartySize(requestedTimeStr, settings) {
  const timeSlots = settings.time_specific_max_party_size || [];
  const timeSlot = timeSlots.find(slot => {
    const [openTime, closeTime] = slot.time_range.split('-');
    return requestedTimeStr >= openTime && requestedTimeStr <= closeTime;
  });

  if (timeSlot) {
    return parseInt(timeSlot.max_party_size, 10);
  }
  return null;
}

updateRestaurantSettings(); 
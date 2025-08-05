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

async function fixOpeningHours() {
  try {
    console.log("🔧 Openingstijden corrigeren...");

    // Restaurant ID dat we willen corrigeren
    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Lege openingstijden (zoals in de app)
    const emptyOpeningHours = {
      monday: { open: "", close: "", closed: true },
      tuesday: { open: "", close: "", closed: true },
      wednesday: { open: "", close: "", closed: true },
      thursday: { open: "", close: "", closed: true },
      friday: { open: "", close: "", closed: true },
      saturday: { open: "", close: "", closed: true },
      sunday: { open: "", close: "", closed: true },
    };

    console.log("📝 Nieuwe openingstijden:");
    console.log(JSON.stringify(emptyOpeningHours, null, 2));

    // Update restaurant openingstijden
    const { data, error } = await supabase
      .from("restaurants")
      .update({ opening_hours: emptyOpeningHours })
      .eq("id", restaurantId)
      .select();

    if (error) {
      console.error("❌ Fout bij updaten openingstijden:", error);
      return;
    }

    console.log("✅ Openingstijden succesvol gecorrigeerd!");
    console.log("📋 Bijgewerkt restaurant:", data[0]);

    // Controleer het resultaat
    const { data: checkData, error: checkError } = await supabase
      .from("restaurants")
      .select("id, name, opening_hours")
      .eq("id", restaurantId)
      .single();

    if (checkError) {
      console.error("❌ Fout bij controleren resultaat:", checkError);
      return;
    }

    console.log("🔍 Controle resultaat:");
    console.log("  - Restaurant:", checkData.name);
    console.log("  - Openingstijden:", JSON.stringify(checkData.opening_hours, null, 2));

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

fixOpeningHours(); 
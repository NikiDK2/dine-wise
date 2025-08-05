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

async function setOpeningHours() {
  try {
    console.log("🕐 Openingstijden instellen...");

    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Openingstijden instellen (open van 12:00-22:00)
    const openingHours = {
      monday: { open: "12:00", close: "22:00", closed: false },
      tuesday: { open: "12:00", close: "22:00", closed: false },
      wednesday: { open: "12:00", close: "22:00", closed: false },
      thursday: { open: "12:00", close: "22:00", closed: false },
      friday: { open: "12:00", close: "22:00", closed: false },
      saturday: { open: "12:00", close: "22:00", closed: false },
      sunday: { open: "12:00", close: "22:00", closed: false },
    };

    console.log("📝 Nieuwe openingstijden:");
    console.log(JSON.stringify(openingHours, null, 2));

    // Update restaurant openingstijden
    const { data, error } = await supabase
      .from("restaurants")
      .update({ opening_hours: openingHours })
      .eq("id", restaurantId)
      .select();

    if (error) {
      console.error("❌ Fout bij updaten openingstijden:", error);
      return;
    }

    console.log("✅ Openingstijden succesvol ingesteld!");
    console.log("📋 Bijgewerkt restaurant:", data[0]);

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

setOpeningHours(); 
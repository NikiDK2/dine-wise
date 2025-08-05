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

async function cleanupDatabase() {
  try {
    console.log("🧹 Database opschonen...");

    // 1. Haal alle restaurants op
    const { data: allRestaurants, error: fetchError } = await supabase
      .from("restaurants")
      .select("id, name, created_at");

    if (fetchError) {
      console.error("❌ Fout bij ophalen restaurants:", fetchError);
      return;
    }

    console.log(`📋 ${allRestaurants.length} restaurants gevonden:`);
    allRestaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.id}) - ${restaurant.created_at}`);
    });

    // 2. Verwijder alle restaurants behalve het juiste
    const correctRestaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";
    const restaurantsToDelete = allRestaurants.filter(r => r.id !== correctRestaurantId);

    console.log(`🗑️  ${restaurantsToDelete.length} restaurants worden verwijderd:`);
    restaurantsToDelete.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.id})`);
    });

    // 3. Verwijder de overbodige restaurants
    for (const restaurant of restaurantsToDelete) {
      const { error: deleteError } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", restaurant.id);

      if (deleteError) {
        console.error(`❌ Fout bij verwijderen restaurant ${restaurant.id}:`, deleteError);
      } else {
        console.log(`✅ Restaurant ${restaurant.name} (${restaurant.id}) verwijderd`);
      }
    }

    // 4. Controleer het resultaat
    const { data: remainingRestaurants, error: checkError } = await supabase
      .from("restaurants")
      .select("id, name, opening_hours, created_at");

    if (checkError) {
      console.error("❌ Fout bij controleren resultaat:", checkError);
      return;
    }

    console.log(`\n✅ Database opgeschoond! ${remainingRestaurants.length} restaurant(s) over:`);
    remainingRestaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.id})`);
      console.log(`     Openingstijden: ${JSON.stringify(restaurant.opening_hours, null, 2)}`);
    });

  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

cleanupDatabase(); 
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
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkRestaurants() {
  try {
    console.log("🔍 Controleren welke restaurants er in de database staan...");

    // Haal alle restaurants op
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fout bij ophalen restaurants:", error);
      return;
    }

    console.log(`✅ ${restaurants.length} restaurants gevonden in database:`);

    if (restaurants.length === 0) {
      console.log(
        "📝 Geen restaurants gevonden. Maak eerst een restaurant aan."
      );
      return;
    }

    restaurants.forEach((restaurant, index) => {
      console.log(`\n${index + 1}. Restaurant:`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Naam: ${restaurant.name}`);
      console.log(`   Eigenaar: ${restaurant.owner_id}`);
      console.log(`   Adres: ${restaurant.address}`);
      console.log(
        `   Aangemaakt: ${new Date(restaurant.created_at).toLocaleString(
          "nl-NL"
        )}`
      );
    });

    // Controleer specifiek het restaurant ID uit de foutmelding
    const targetId = "29edb315-eed1-481f-9251-c113e56dbdca";
    const targetRestaurant = restaurants.find((r) => r.id === targetId);

    if (targetRestaurant) {
      console.log(`\n✅ Restaurant ID ${targetId} gevonden!`);
      console.log(`   Naam: ${targetRestaurant.name}`);
    } else {
      console.log(`\n❌ Restaurant ID ${targetId} NIET gevonden in database.`);
      console.log("   Mogelijke oorzaken:");
      console.log("   - Restaurant is niet correct aangemaakt");
      console.log("   - Database connectie probleem");
      console.log("   - Verkeerd restaurant ID gebruikt");
    }
  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

checkRestaurants();

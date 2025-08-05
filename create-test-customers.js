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

async function createTestCustomers() {
  try {
    console.log("👥 Test klanten aanmaken...");

    const restaurantId = "29edb315-eed1-481f-9251-c113e56dbdca";

    // Test klanten
    const testCustomers = [
      {
        name: "Jan Janssens",
        email: "jan.janssens@email.com",
        phone: "+32 3 123 45 67",
        restaurant_id: restaurantId,
        notes: "Test klant 1",
      },
      {
        name: "Maria Peeters",
        email: "maria.peeters@email.com",
        phone: "+32 3 234 56 78",
        restaurant_id: restaurantId,
        notes: "Test klant 2",
      },
      {
        name: "Pieter Van den Berg",
        email: "pieter.vandenberg@email.com",
        phone: "+32 3 345 67 89",
        restaurant_id: restaurantId,
        notes: "Test klant 3",
      },
      {
        name: "Anna De Vries",
        email: "anna.devries@email.com",
        phone: "+32 3 456 78 90",
        restaurant_id: restaurantId,
        notes: "Test klant 4",
      },
      {
        name: "Thomas Willems",
        email: "thomas.willems@email.com",
        phone: "+32 3 567 89 01",
        restaurant_id: restaurantId,
        notes: "Test klant 5",
      },
    ];

    console.log(`📝 ${testCustomers.length} klanten worden aangemaakt...`);

    for (const customer of testCustomers) {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select();

      if (error) {
        console.error(`❌ Fout bij aanmaken klant ${customer.name}:`, error);
      } else {
        console.log(`✅ Klant aangemaakt: ${customer.name} (${data[0].id})`);
      }
    }

    // Controleer het resultaat
    console.log("\n🔍 Controle resultaat:");
    const { data: allCustomers, error: checkError } = await supabase
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (checkError) {
      console.error("❌ Fout bij controleren resultaat:", checkError);
      return;
    }

    console.log(`📋 ${allCustomers.length} klanten gevonden voor restaurant:`);
    allCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} (${customer.email})`);
    });
  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

createTestCustomers();

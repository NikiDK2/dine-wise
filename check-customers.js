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

async function checkCustomers() {
  try {
    console.log("👥 Klanten controleren...");

    // Haal alle klanten op
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fout bij ophalen klanten:", error);
      return;
    }

    console.log(`📋 ${customers.length} klanten gevonden in database:`);

    if (customers.length === 0) {
      console.log("📝 Geen klanten gevonden. Maak eerst enkele klanten aan.");
      return;
    }

    customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. Klant:`);
      console.log(`   ID: ${customer.id}`);
      console.log(`   Naam: ${customer.name}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Telefoon: ${customer.phone || "Niet opgegeven"}`);
      console.log(`   Restaurant ID: ${customer.restaurant_id}`);
      console.log(
        `   Aangemaakt: ${new Date(customer.created_at).toLocaleString(
          "nl-NL"
        )}`
      );
    });

    // Controleer ook reserveringen
    console.log("\n📅 Reserveringen controleren...");
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (reservationsError) {
      console.error("❌ Fout bij ophalen reserveringen:", reservationsError);
      return;
    }

    console.log(
      `📋 ${reservations.length} reserveringen gevonden in database:`
    );

    if (reservations.length === 0) {
      console.log("📝 Geen reserveringen gevonden.");
      return;
    }

    reservations.forEach((reservation, index) => {
      console.log(`\n${index + 1}. Reservering:`);
      console.log(`   ID: ${reservation.id}`);
      console.log(`   Klant: ${reservation.customer_name}`);
      console.log(`   Datum: ${reservation.reservation_date}`);
      console.log(`   Tijd: ${reservation.reservation_time}`);
      console.log(`   Aantal: ${reservation.party_size}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Restaurant ID: ${reservation.restaurant_id}`);
      console.log(
        `   Aangemaakt: ${new Date(reservation.created_at).toLocaleString(
          "nl-NL"
        )}`
      );
    });
  } catch (error) {
    console.error("❌ Onverwachte fout:", error);
  }
}

checkCustomers();

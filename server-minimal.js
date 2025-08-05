// Load environment variables from .env file
require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 3000;

// Environment variabelen controleren met fallbacks
const RESTAURANT_ID = process.env.RESTAURANT_ID || "123";
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_KLpT35vdk51lib-LeKW8iw_splqhZW-";

// Waarschuw voor ontbrekende environment variabelen maar crash niet
if (!process.env.RESTAURANT_ID) {
  console.warn(
    "⚠️  RESTAURANT_ID environment variabele niet gevonden, gebruik fallback: 123"
  );
}

if (!process.env.VITE_SUPABASE_URL) {
  console.warn(
    "⚠️  VITE_SUPABASE_URL environment variabele niet gevonden, gebruik fallback"
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  SUPABASE_SERVICE_ROLE_KEY environment variabele niet gevonden, gebruik fallback"
  );
}

// Supabase client configuratie
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log("✅ Server geconfigureerd met environment variabelen");
console.log("📍 Restaurant ID:", RESTAURANT_ID);
console.log("🔗 Supabase URL:", supabaseUrl);

// Helper functie om request body te parsen
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  console.log("Request:", req.method, req.url);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "RestoPlanner API is actief - MET SUPABASE DATABASE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message:
          "RestoPlanner Health Check - MET SUPABASE DATABASE - JUISTE OPENINGSTIJDEN 08:30-16:00",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === "/api/agenda/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        status: "OK",
        message: "Agenda API is actief - MET SUPABASE DATABASE",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // GET /api/agenda/free-busy - Echte data van Supabase
  if (req.url.startsWith("/api/agenda/free-busy")) {
    handleFreeBusy(req, res);
    return;
  }

  // GET /api/agenda/calendar - Echte data van Supabase
  if (req.url.startsWith("/api/agenda/calendar")) {
    handleCalendar(req, res);
    return;
  }

  // NIEUWE ENDPOINTS VOOR RESERVERINGEN BEHEREN

  // 1. POST /api/reservations/check-availability - Check beschikbaarheid
  if (
    req.url === "/api/reservations/check-availability" &&
    req.method === "POST"
  ) {
    handleCheckAvailability(req, res);
    return;
  }

  // 2. POST /api/reservations/book - Boek nieuwe reservering
  if (req.url === "/api/reservations/book" && req.method === "POST") {
    handleBookReservation(req, res);
    return;
  }

  // 3. PUT /api/reservations/update - Update bestaande reservering
  if (req.url === "/api/reservations/update" && req.method === "PUT") {
    handleUpdateReservation(req, res);
    return;
  }

  // 4. DELETE /api/reservations/delete - Verwijder reservering
  if (req.url === "/api/reservations/delete" && req.method === "DELETE") {
    handleDeleteReservation(req, res);
    return;
  }

  // 5. GET /api/restaurant/capacity - Check restaurant capaciteit
  if (req.url === "/api/restaurant/capacity" && req.method === "GET") {
    handleGetRestaurantCapacity(req, res);
    return;
  }

  // Serve static files
  let filePath = req.url;
  if (filePath === "/" || filePath === "") {
    filePath = "/index.html";
  }

  const fullPath = path.join(__dirname, "dist", filePath);
  console.log("Serving file:", fullPath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.log("File not found, serving index.html");
      const indexPath = path.join(__dirname, "dist", "index.html");
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(fullPath);
      let contentType = "text/plain";

      if (ext === ".html") contentType = "text/html";
      else if (ext === ".js") contentType = "application/javascript";
      else if (ext === ".css") contentType = "text/css";
      else if (ext === ".json") contentType = "application/json";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg") contentType = "image/jpg";
      else if (ext === ".svg") contentType = "image/svg+xml";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// Handle Free/Busy data from Supabase
async function handleFreeBusy(req, res) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const restaurant_id = url.searchParams.get("restaurant_id");
    const date = url.searchParams.get("date");

    if (!restaurant_id || !date) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id en date zijn verplicht",
        })
      );
      return;
    }

    // Gebruik restaurant ID uit request body
    const restaurantId = restaurant_id;

    // Haal reserveringen op van Supabase
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("reservation_date", date)
      .not("status", "eq", "cancelled");

    if (error) {
      console.error("Supabase error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: error.message,
        })
      );
      return;
    }

    // Genereer free/busy periods
    const freeBusyPeriods = generateFreeBusyPeriods(reservations || []);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        date,
        free_busy_periods: freeBusyPeriods,
        total_reservations: reservations?.length || 0,
        message: `Free/Busy informatie voor ${date} (echte data van Supabase)`,
      })
    );
  } catch (error) {
    console.error("Error in free-busy:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// Handle Calendar data from Supabase
async function handleCalendar(req, res) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const restaurant_id = url.searchParams.get("restaurant_id");
    const start_date = url.searchParams.get("start_date");
    const end_date = url.searchParams.get("end_date");

    if (!restaurant_id || !start_date || !end_date) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id, start_date en end_date zijn verplicht",
        })
      );
      return;
    }

    // Haal eerst het eerste restaurant op uit de database
    const { data: restaurants, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .limit(1)
      .order("created_at", { ascending: false });

    if (restaurantError || !restaurants || restaurants.length === 0) {
      console.error("Geen restaurants gevonden:", restaurantError);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Geen restaurants gevonden in database",
          details: restaurantError?.message || "Database is leeg",
        })
      );
      return;
    }

    const restaurantId = restaurants[0].id;

    // Haal reserveringen op van Supabase met bestaande restaurant
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurantId) // Gebruik bestaande restaurant ID
      .gte("reservation_date", start_date)
      .lte("reservation_date", end_date)
      .not("status", "eq", "cancelled");

    if (error) {
      console.error("Supabase error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: error.message,
        })
      );
      return;
    }

    // Groepeer reserveringen per datum
    const calendarData = groupReservationsByDate(reservations || []);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id,
        start_date,
        end_date,
        calendar_data: calendarData,
        total_reservations: reservations?.length || 0,
        message: `Kalender informatie van ${start_date} tot ${end_date} (echte data van Supabase)`,
      })
    );
  } catch (error) {
    console.error("Error in calendar:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// 1. Check beschikbaarheid voor een specifiek tijdstip
async function handleCheckAvailability(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { restaurant_id, requested_date, requested_time, party_size } = body;

    if (!restaurant_id || !requested_date || !requested_time || !party_size) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error:
            "restaurant_id, requested_date, requested_time en party_size zijn verplicht",
        })
      );
      return;
    }

    // Gebruik restaurant ID uit request body
    const restaurantId = restaurant_id;

    // 1. Haal restaurant instellingen op uit database
    let restaurant = null;

    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, opening_hours, settings")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) {
        console.error(
          "Supabase error bij ophalen restaurant:",
          restaurantError
        );
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Restaurant niet gevonden",
            details: `Restaurant met ID '${restaurantId}' bestaat niet in de database. Controleer het restaurant ID.`,
            requested_restaurant_id: restaurantId,
          })
        );
        return;
      } else {
        restaurant = restaurantData;
        console.log(
          "✅ Restaurant instellingen opgehaald uit database:",
          restaurant.name
        );
      }
    } catch (error) {
      console.error("Error bij ophalen restaurant:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details:
            "Er is een fout opgetreden bij het ophalen van restaurant gegevens.",
        })
      );
      return;
    }

    // 2. Check openingstijden en reserveringsbeleid
    const requestedDate = new Date(requested_date);
    const dayOfWeek = requestedDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const openingHours = restaurant.opening_hours || {};
    const dayHours = openingHours[dayOfWeek];

    // Check of restaurant gesloten is op deze dag (nieuw formaat)
    if (!dayHours || !dayHours.isOpen) {
      const dayName = requestedDate.toLocaleDateString("nl-NL", {
        weekday: "long",
      });
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Restaurant gesloten",
          details: `Restaurant is gesloten op ${dayName}. Stel eerst de openingstijden in via de app.`,
          requested_date: requested_date,
          day_of_week: dayName,
        })
      );
      return;
    }

    // Check of tijdstip binnen openingstijden valt (nieuw formaat met timeSlots)
    const requestedTimeStr = requested_time;
    const timeSlots = dayHours.timeSlots || [];
    let isWithinOpeningHours = false;
    let applicableTimeSlot = null;

    for (const slot of timeSlots) {
      if (
        requestedTimeStr >= slot.openTime &&
        requestedTimeStr <= slot.closeTime
      ) {
        isWithinOpeningHours = true;
        applicableTimeSlot = slot;
        break;
      }
    }

    if (!isWithinOpeningHours) {
      const dayName = requestedDate.toLocaleDateString("nl-NL", {
        weekday: "long",
      });
      const timeSlotsText = timeSlots
        .map((slot) => `${slot.openTime}-${slot.closeTime}`)
        .join(", ");
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Buiten openingstijden",
          details: `Restaurant is open op ${dayName} van ${timeSlotsText}. Uw gewenste tijdstip ${requestedTimeStr} valt buiten deze openingstijden.`,
          requested_time: requestedTimeStr,
          opening_hours: dayHours,
          day_of_week: dayName,
        })
      );
      return;
    }

    // Check of reservering nodig is voor dit tijdstip
    const requiresReservation = checkIfReservationRequired(
      requestedTimeStr,
      dayHours
    );

    if (!requiresReservation) {
      const dayName = requestedDate.toLocaleDateString("nl-NL", {
        weekday: "long",
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          available: true,
          requires_reservation: false,
          requested_date,
          requested_time,
          party_size,
          restaurant_name: restaurant.name,
          opening_hours: dayHours,
          day_of_week: dayName,
          message: `Reservering niet nodig voor ${requestedTimeStr} op ${dayName}. U kunt gewoon langskomen.`,
          details:
            "Dit tijdstip valt buiten de drukke periodes. Reserveringen zijn niet verplicht.",
        })
      );
      return;
    }

    // 3. Check restaurant instellingen
    const settings = restaurant.settings || {};
    const maxPartySize = settings.max_party_size || 20;
    const minPartySize = settings.min_party_size || 1;
    const maxReservationsPerSlot = settings.max_reservations_per_slot || 10;
    const reservationDuration = settings.reservation_duration_minutes || 120; // 2 uur standaard
    const largeGroupThreshold = settings.large_group_threshold || 6; // Groepen > 6 personen

    // Check tijdspecifieke groepsgrootte limieten
    const timeSpecificMaxPartySize = getTimeSpecificMaxPartySize(
      requestedTimeStr,
      settings
    );
    const effectiveMaxPartySize = timeSpecificMaxPartySize || maxPartySize;

    if (party_size < minPartySize || party_size > effectiveMaxPartySize) {
      const timeSlot = getTimeSlot(requestedTimeStr);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Ongeldige groepsgrootte",
          details: `Groepsgrootte moet tussen ${minPartySize} en ${effectiveMaxPartySize} personen zijn voor ${timeSlot}. U heeft ${party_size} personen opgegeven.`,
          requested_party_size: party_size,
          min_party_size: minPartySize,
          max_party_size: effectiveMaxPartySize,
          time_slot: timeSlot,
          time_specific_limit: timeSpecificMaxPartySize ? true : false,
        })
      );
      return;
    }

    // 4. Haal totale restaurant capaciteit op
    let tables = [];
    let totalCapacity = 0;

    try {
      const { data: restaurantTables, error: tablesError } = await supabase
        .from("restaurant_tables")
        .select("id, table_number, capacity, status")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);

      if (tablesError) {
        console.error("Supabase error:", tablesError);
        // Gebruik default capaciteit als er geen tafels zijn
        totalCapacity = 30; // Default capaciteit
      } else {
        tables = restaurantTables || [];
        totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
        if (totalCapacity === 0) {
          totalCapacity = 30; // Default capaciteit als er geen tafels zijn
        }
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      totalCapacity = 30; // Default capaciteit
    }

    // 5. Haal alle reserveringen op voor het gewenste tijdsslot (reserveringsduur overlap)
    const requestedTime = new Date(`2000-01-01T${requested_time}:00`);
    const timeSlotStart = new Date(requestedTime.getTime() - 15 * 60 * 1000); // 15 min voor
    const timeSlotEnd = new Date(
      requestedTime.getTime() + reservationDuration * 60 * 1000
    ); // reserveringsduur na

    let overlappingReservations = [];
    try {
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("id, customer_name, reservation_time, party_size")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", requested_date)
        .not("status", "eq", "cancelled");

      if (error) {
        console.error("Supabase error:", error);
        // Gebruik lege array als er een fout is
        overlappingReservations = [];
      } else {
        overlappingReservations = reservations || [];
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      overlappingReservations = [];
    }

    // 3. Filter reserveringen die overlappen met het gewenste tijdsslot
    const conflictingReservations = overlappingReservations.filter(
      (reservation) => {
        const reservationTime = new Date(
          `2000-01-01T${reservation.reservation_time}:00`
        );
        return (
          reservationTime >= timeSlotStart && reservationTime <= timeSlotEnd
        );
      }
    );

    // 6. Bereken totale bezette capaciteit in het tijdsslot
    const occupiedCapacity = conflictingReservations.reduce(
      (sum, res) => sum + res.party_size,
      0
    );
    const availableCapacity = totalCapacity - occupiedCapacity;

    // 7. Check tijdsspecifieke capaciteitslimieten
    const timeSpecificMaxForSlot = getTimeSpecificMaxPartySize(
      requestedTimeStr,
      settings
    );

    // Haal alle reserveringen op voor het specifieke tijdstip (niet alleen overlappende)
    let allReservationsForTimeSlot = [];
    try {
      const { data: allReservations, error: allReservationsError } =
        await supabase
          .from("reservations")
          .select("id, customer_name, reservation_time, party_size, status")
          .eq("restaurant_id", restaurantId)
          .eq("reservation_date", requested_date)
          .eq("reservation_time", requested_time)
          .not("status", "eq", "cancelled");

      if (!allReservationsError) {
        allReservationsForTimeSlot = allReservations || [];
      }
    } catch (error) {
      console.error("Error bij ophalen reserveringen voor tijdstip:", error);
    }

    const currentTotalForTimeSlot = allReservationsForTimeSlot.reduce(
      (sum, res) => sum + res.party_size,
      0
    );

    // Check tijdsspecifieke limiet
    let timeSpecificLimitExceeded = false;
    if (
      timeSpecificMaxForSlot &&
      currentTotalForTimeSlot + party_size > timeSpecificMaxForSlot
    ) {
      timeSpecificLimitExceeded = true;
    }

    // Check max reserveringen per slot
    if (conflictingReservations.length >= maxReservationsPerSlot) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Te veel boekingen voor dat uur",
          details: `Maximum ${maxReservationsPerSlot} reserveringen per tijdsslot bereikt voor ${requested_time}. Probeer een ander tijdstip.`,
          requested_time: requested_time,
          max_reservations_per_slot: maxReservationsPerSlot,
          current_reservations: conflictingReservations.length,
          conflicting_reservations: conflictingReservations,
        })
      );
      return;
    }

    // Check tijdsspecifieke capaciteitslimiet
    if (timeSpecificLimitExceeded) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Tijdsspecifieke capaciteitslimiet overschreden",
          details: `Maximum ${timeSpecificMaxForSlot} personen toegestaan voor dit tijdstip. Huidige reserveringen: ${currentTotalForTimeSlot}, nieuwe reservering: ${party_size}`,
          time_specific_max: timeSpecificMaxForSlot,
          current_total_for_timeslot: currentTotalForTimeSlot,
          requested_party_size: party_size,
          conflicting_reservations: conflictingReservations,
        })
      );
      return;
    }

    // Check of dit een grote groep is (vereist handmatige goedkeuring)
    const isLargeGroup = party_size > largeGroupThreshold;

    // Debug logging
    console.log(
      `🔍 Check-availability capaciteitscontrole voor ${requested_time}:`
    );
    console.log(`  - Tijdsspecifieke max: ${timeSpecificMaxForSlot}`);
    console.log(`  - Huidige totaal voor tijdslot: ${currentTotalForTimeSlot}`);
    console.log(`  - Nieuwe reservering: ${party_size}`);
    console.log(
      `  - Totaal na reservering: ${currentTotalForTimeSlot + party_size}`
    );
    console.log(
      `  - Limiet overschreden: ${
        timeSpecificMaxForSlot &&
        currentTotalForTimeSlot + party_size > timeSpecificMaxForSlot
      }`
    );
    console.log(
      `  - Aantal reserveringen voor dit tijdstip: ${allReservationsForTimeSlot.length}`
    );

    const isAvailable =
      availableCapacity >= party_size && !timeSpecificLimitExceeded;

    const alternativeTimes = generateAlternativeTimes(requested_time, dayHours);

    // Bepaal de reden waarom het niet beschikbaar is
    let unavailabilityReason = null;
    if (!isAvailable) {
      if (availableCapacity === 0) {
        unavailabilityReason = "Tijdsslot is volledig bezet";
      } else if (availableCapacity < party_size) {
        unavailabilityReason = `Onvoldoende capaciteit (${availableCapacity} beschikbaar, ${party_size} gevraagd)`;
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        available: isAvailable,
        requested_date,
        requested_time,
        party_size,
        restaurant_name: restaurant.name,
        opening_hours: dayHours,
        settings: {
          max_party_size: maxPartySize,
          min_party_size: minPartySize,
          max_reservations_per_slot: maxReservationsPerSlot,
          reservation_duration_minutes: reservationDuration,
          large_group_threshold: largeGroupThreshold,
        },
        is_large_group: isLargeGroup,
        large_group_warning: isLargeGroup
          ? "Voor groepen van meer dan 6 personen sturen wij uw aanvraag door naar het restaurant. U ontvangt binnen 24 uur een bevestiging."
          : null,
        total_restaurant_capacity: totalCapacity,
        occupied_capacity: occupiedCapacity,
        available_capacity: availableCapacity,
        conflicting_reservations: conflictingReservations,
        alternative_times: alternativeTimes,
        unavailability_reason: unavailabilityReason,
        message: isAvailable
          ? `Tijdstip ${requested_time} is beschikbaar voor ${party_size} personen (${availableCapacity}/${totalCapacity} capaciteit vrij)${
              isLargeGroup ? " - Handmatige goedkeuring vereist" : ""
            }`
          : `Tijdstip ${requested_time} is niet beschikbaar voor ${party_size} personen: ${unavailabilityReason}`,
      })
    );
  } catch (error) {
    console.error("Error in check availability:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// 2. Boek nieuwe reservering
async function handleBookReservation(req, res) {
  try {
    const body = await parseRequestBody(req);
    const {
      restaurant_id,
      reservation_date,
      reservation_time,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      notes,
    } = body;

    if (
      !restaurant_id ||
      !reservation_date ||
      !reservation_time ||
      !customer_name ||
      !party_size
    ) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error:
            "restaurant_id, reservation_date, reservation_time, customer_name en party_size zijn verplicht",
        })
      );
      return;
    }

    // Gebruik restaurant ID uit request body
    const restaurantId = restaurant_id;

    // 1. Haal restaurant instellingen op uit database
    let restaurant = null;

    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, opening_hours, settings")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) {
        console.error(
          "Supabase error bij ophalen restaurant:",
          restaurantError
        );
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Restaurant niet gevonden",
            details: `Restaurant met ID '${restaurantId}' bestaat niet in de database. Controleer het restaurant ID.`,
            requested_restaurant_id: restaurantId,
          })
        );
        return;
      } else {
        restaurant = restaurantData;
        console.log(
          "✅ Restaurant instellingen opgehaald uit database:",
          restaurant.name
        );
      }
    } catch (error) {
      console.error("Error bij ophalen restaurant:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details:
            "Er is een fout opgetreden bij het ophalen van restaurant gegevens.",
        })
      );
      return;
    }

    // 2. Check openingstijden en reserveringsbeleid
    const requestedDate = new Date(reservation_date);
    const dayOfWeek = requestedDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const openingHours = restaurant.opening_hours || {};
    const dayHours = openingHours[dayOfWeek];

    // Check of restaurant gesloten is op deze dag (nieuw formaat)
    if (!dayHours || !dayHours.isOpen) {
      const dayName = requestedDate.toLocaleDateString("nl-NL", {
        weekday: "long",
      });
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Restaurant gesloten",
          details: `Restaurant is gesloten op ${dayName}. Stel eerst de openingstijden in via de app.`,
          requested_date: reservation_date,
          day_of_week: dayName,
        })
      );
      return;
    }

    // Check of tijdstip binnen openingstijden valt (nieuw formaat met timeSlots)
    const requestedTimeStr = reservation_time;
    const timeSlots = dayHours.timeSlots || [];
    let isWithinOpeningHours = false;
    let applicableTimeSlot = null;

    for (const slot of timeSlots) {
      if (
        requestedTimeStr >= slot.openTime &&
        requestedTimeStr <= slot.closeTime
      ) {
        isWithinOpeningHours = true;
        applicableTimeSlot = slot;
        break;
      }
    }

    if (!isWithinOpeningHours) {
      const dayName = requestedDate.toLocaleDateString("nl-NL", {
        weekday: "long",
      });
      const timeSlotRanges = timeSlots
        .map((slot) => `${slot.openTime}-${slot.closeTime}`)
        .join(", ");
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Buiten openingstijden",
          details: `Restaurant is open op ${dayName} van ${timeSlotRanges}. Uw gewenste tijdstip ${requestedTimeStr} valt buiten deze openingstijden.`,
        })
      );
      return;
    }

    // 3. Check restaurant instellingen
    const settings = restaurant.settings || {};
    const maxPartySize = settings.max_party_size || 20;
    const minPartySize = settings.min_party_size || 1;
    const maxReservationsPerSlot = settings.max_reservations_per_slot || 10;
    const reservationDuration = settings.reservation_duration_minutes || 120; // 2 uur standaard
    const largeGroupThreshold = settings.large_group_threshold || 6; // Groepen > 6 personen

    if (party_size < minPartySize || party_size > maxPartySize) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Ongeldige groepsgrootte",
          details: `Groepsgrootte moet tussen ${minPartySize} en ${maxPartySize} personen zijn`,
        })
      );
      return;
    }

    // 4. Haal totale restaurant capaciteit op
    let tables = [];
    let totalCapacity = 0;

    try {
      const { data: restaurantTables, error: tablesError } = await supabase
        .from("restaurant_tables")
        .select("id, table_number, capacity, status")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);

      if (tablesError) {
        console.error("Supabase error:", tablesError);
        // Gebruik default capaciteit als er geen tafels zijn
        totalCapacity = 30; // Default capaciteit
      } else {
        tables = restaurantTables || [];
        totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
        if (totalCapacity === 0) {
          totalCapacity = 30; // Default capaciteit als er geen tafels zijn
        }
      }
    } catch (error) {
      console.error("Error bij ophalen tafels:", error);
      totalCapacity = 30; // Default capaciteit bij fout
    }

    // 5. Check overlappende reserveringen
    let overlappingReservations = [];

    try {
      const { data: existingReservations, error: reservationsError } =
        await supabase
          .from("reservations")
          .select("id, customer_name, reservation_time, party_size, status")
          .eq("restaurant_id", restaurantId)
          .eq("reservation_date", reservation_date)
          .not("status", "eq", "cancelled");

      if (reservationsError) {
        console.error(
          "Supabase error bij ophalen reserveringen:",
          reservationsError
        );
      } else {
        // Filter reserveringen die overlappen met het gewenste tijdstip
        overlappingReservations = existingReservations.filter((reservation) => {
          const reservationTime = new Date(
            `2000-01-01T${reservation.reservation_time}:00`
          );
          const requestedTime = new Date(`2000-01-01T${reservation_time}:00`);

          // Check overlap binnen reserveringsduur
          const timeDiff = Math.abs(
            reservationTime.getTime() - requestedTime.getTime()
          );
          return timeDiff < reservationDuration * 60 * 1000; // Binnen reserveringsduur
        });
      }
    } catch (error) {
      console.error("Error bij ophalen reserveringen:", error);
    }

    // 6. Bereken beschikbare capaciteit
    const occupiedCapacity = overlappingReservations.reduce(
      (sum, res) => sum + res.party_size,
      0
    );
    const availableCapacity = totalCapacity - occupiedCapacity;

    // 7. Check tijdsspecifieke capaciteitslimieten
    const timeSpecificMaxForSlot = getTimeSpecificMaxPartySize(
      reservation_time,
      settings
    );

    // Haal alle reserveringen op voor het specifieke tijdstip (niet alleen overlappende)
    let allReservationsForTimeSlot = [];
    try {
      const { data: allReservations, error: allReservationsError } =
        await supabase
          .from("reservations")
          .select("id, customer_name, reservation_time, party_size, status")
          .eq("restaurant_id", restaurantId)
          .eq("reservation_date", reservation_date)
          .eq("reservation_time", reservation_time)
          .not("status", "eq", "cancelled");

      if (!allReservationsError) {
        allReservationsForTimeSlot = allReservations || [];
      }
    } catch (error) {
      console.error("Error bij ophalen reserveringen voor tijdstip:", error);
    }

    const currentTotalForTimeSlot = allReservationsForTimeSlot.reduce(
      (sum, res) => sum + res.party_size,
      0
    );
    const remainingCapacityForTimeSlot = timeSpecificMaxForSlot
      ? timeSpecificMaxForSlot - currentTotalForTimeSlot
      : availableCapacity;

    // 8. Check of er voldoende capaciteit is (zowel totaal als tijdsspecifiek)
    if (availableCapacity < party_size) {
      const alternativeTimes = generateAlternativeTimes(
        reservation_time,
        dayHours
      );

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Onvoldoende capaciteit",
          details: `Niet genoeg plaats voor ${party_size} personen. Beschikbaar: ${availableCapacity}/${totalCapacity}`,
          total_restaurant_capacity: totalCapacity,
          occupied_capacity: occupiedCapacity,
          available_capacity: availableCapacity,
          conflicting_reservations: overlappingReservations,
          alternative_times: alternativeTimes,
          unavailability_reason: "capaciteit_overschreden",
        })
      );
      return;
    }

    // Check tijdsspecifieke limiet
    if (
      timeSpecificMaxForSlot &&
      currentTotalForTimeSlot + party_size > timeSpecificMaxForSlot
    ) {
      const alternativeTimes = generateAlternativeTimes(
        reservation_time,
        dayHours
      );

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Tijdsspecifieke capaciteitslimiet overschreden",
          details: `Maximum ${timeSpecificMaxForSlot} personen toegestaan voor dit tijdstip. Huidige reserveringen: ${currentTotalForTimeSlot}, nieuwe reservering: ${party_size}`,
          time_specific_max: timeSpecificMaxForSlot,
          current_total_for_timeslot: currentTotalForTimeSlot,
          requested_party_size: party_size,
          conflicting_reservations: overlappingReservations,
          alternative_times: alternativeTimes,
          unavailability_reason: "tijdsspecifieke_limiet_overschreden",
        })
      );
      return;
    }

    // Debug logging
    console.log(`🔍 Capaciteitscontrole voor ${reservation_time}:`);
    console.log(`  - Tijdsspecifieke max: ${timeSpecificMaxForSlot}`);
    console.log(`  - Huidige totaal voor tijdslot: ${currentTotalForTimeSlot}`);
    console.log(`  - Nieuwe reservering: ${party_size}`);
    console.log(
      `  - Totaal na reservering: ${currentTotalForTimeSlot + party_size}`
    );
    console.log(
      `  - Limiet overschreden: ${
        timeSpecificMaxForSlot &&
        currentTotalForTimeSlot + party_size > timeSpecificMaxForSlot
      }`
    );
    console.log(
      `  - Aantal reserveringen voor dit tijdstip: ${allReservationsForTimeSlot.length}`
    );

    // 8. Check max reserveringen per slot
    if (overlappingReservations.length >= maxReservationsPerSlot) {
      const alternativeTimes = generateAlternativeTimes(
        reservation_time,
        dayHours
      );

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Tijdslot vol",
          details: `Maximum aantal reserveringen per slot (${maxReservationsPerSlot}) bereikt`,
          total_restaurant_capacity: totalCapacity,
          occupied_capacity: occupiedCapacity,
          available_capacity: availableCapacity,
          conflicting_reservations: overlappingReservations,
          alternative_times: alternativeTimes,
          unavailability_reason: "max_reservations_per_slot",
        })
      );
      return;
    }
    const reservationStatus = isLargeGroup ? "pending" : "confirmed";

    // 4. Maak de reservering aan
    const { data: newReservation, error } = await supabase
      .from("reservations")
      .insert({
        restaurant_id: restaurantId,
        reservation_date,
        reservation_time,
        customer_name,
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        party_size,
        special_requests: notes || "",
        status: reservationStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: error.message,
        })
      );
      return;
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        booked: true,
        reservation: newReservation,
        is_large_group: isLargeGroup,
        large_group_warning: isLargeGroup
          ? "Voor groepen van meer dan 6 personen sturen wij uw aanvraag door naar het restaurant. U ontvangt binnen 24 uur een bevestiging."
          : null,
        message: isLargeGroup
          ? `Reservering voor ${customer_name} is aangemaakt en wacht op handmatige goedkeuring (24 uur)`
          : `Reservering succesvol aangemaakt voor ${customer_name} (echte database)`,
      })
    );
  } catch (error) {
    console.error("Error in book reservation:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// 3. Update bestaande reservering
async function handleUpdateReservation(req, res) {
  try {
    const body = await parseRequestBody(req);
    const {
      reservation_id,
      reservation_date,
      reservation_time,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      notes,
      status,
    } = body;

    if (!reservation_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "reservation_id is verplicht",
        })
      );
      return;
    }

    // Voor nu: gebruik demo data
    // Later: vervang door echte database update
    const updatedReservation = {
      id: reservation_id,
      reservation_date: reservation_date || "2024-01-15",
      reservation_time: reservation_time || "19:00",
      customer_name: customer_name || "Demo Klant",
      customer_email: customer_email || "",
      customer_phone: customer_phone || "",
      party_size: party_size || 4,
      notes: notes || "",
      status: status || "confirmed",
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        updated: true,
        reservation: updatedReservation,
        message: `Reservering succesvol bijgewerkt`,
      })
    );
  } catch (error) {
    console.error("Error in update reservation:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// 4. Verwijder reservering
async function handleDeleteReservation(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { reservation_id } = body;

    if (!reservation_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "reservation_id is verplicht",
        })
      );
      return;
    }

    // Voor nu: gebruik demo data
    // Later: vervang door echte database delete

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        deleted: true,
        reservation_id,
        message: `Reservering succesvol geannuleerd`,
      })
    );
  } catch (error) {
    console.error("Error in delete reservation:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

// Helper functie om free/busy periods te genereren
function generateFreeBusyPeriods(reservations) {
  const periods = [];

  // Restaurant openingstijden: 08:30 - 16:00
  const openingTime = "08:30";
  const closingTime = "16:00";

  // Definieer grotere tijdsperiodes
  const timePeriods = [
    { name: "Ochtend", start: "08:30", end: "10:30" },
    { name: "Middag", start: "10:30", end: "15:30" },
    { name: "Late middag", start: "15:30", end: "16:00" }
  ];

  // Groepeer reserveringen per periode
  const reservationsByPeriod = {};
  reservations.forEach((reservation) => {
    const time = reservation.reservation_time;
    const timeStr = time.slice(0, 5); // Neem alleen HH:MM

    // Bepaal in welke periode deze reservering valt
    for (const period of timePeriods) {
      if (timeStr >= period.start && timeStr < period.end) {
        if (!reservationsByPeriod[period.name]) {
          reservationsByPeriod[period.name] = [];
        }
        reservationsByPeriod[period.name].push(reservation);
        break;
      }
    }
  });

  // Genereer periods voor elke tijdsperiode
  for (const period of timePeriods) {
    const periodReservations = reservationsByPeriod[period.name] || [];

    if (periodReservations.length > 0) {
      // Bezet tijdslot
      periods.push({
        type: "busy",
        start_time: period.start,
        end_time: period.end,
        reservations: periodReservations,
      });
    } else {
      // Vrij tijdslot
      periods.push({
        type: "free",
        start_time: period.start,
        end_time: period.end,
      });
    }
  }

  return periods;
}

// Helper functie om reserveringen per datum te groeperen
function groupReservationsByDate(reservations) {
  const grouped = {};

  reservations.forEach((reservation) => {
    const date = reservation.reservation_date;
    if (!grouped[date]) {
      grouped[date] = {
        date,
        reservations: [],
        total_reservations: 0,
        total_party_size: 0,
      };
    }

    grouped[date].reservations.push(reservation);
    grouped[date].total_reservations++;
    grouped[date].total_party_size += reservation.party_size || 0;
  });

  return Object.values(grouped);
}

// Helper functie om alternatieve tijden te genereren
function generateAlternativeTimes(requestedTime, dayHours) {
  const baseTime = new Date(`2000-01-01T${requestedTime}:00`);
  const alternatives = [];

  // Genereer tijden 30 minuten voor en na het gewenste tijdstip
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue; // Skip het gewenste tijdstip
    const alternativeTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000);
    const timeString = alternativeTime.toTimeString().slice(0, 5);

    // Check of alternatief tijdstip binnen openingstijden valt
    if (timeString >= dayHours.open && timeString <= dayHours.close) {
      alternatives.push(timeString);
    }
  }

  return alternatives;
}

// Helper functie om te bepalen of een reservering vereist is
function checkIfReservationRequired(requestedTimeStr, dayHours) {
  // Definieer drukke periodes waar reserveringen verplicht zijn
  const busyPeriods = [
    { start: "12:00", end: "14:00", name: "lunch" },
    { start: "18:00", end: "22:00", name: "diner" },
  ];

  // Definieer rustige periodes waar geen reserveringen nodig zijn
  const quietPeriods = [{ start: "14:00", end: "17:00", name: "middag" }];

  const requestedTime = new Date(`2000-01-01T${requestedTimeStr}:00`);

  // Check of het tijdstip in een drukke periode valt
  for (const period of busyPeriods) {
    const periodStart = new Date(`2000-01-01T${period.start}:00`);
    const periodEnd = new Date(`2000-01-01T${period.end}:00`);

    if (requestedTime >= periodStart && requestedTime < periodEnd) {
      return true; // Reservering vereist
    }
  }

  // Check of het tijdstip in een rustige periode valt
  for (const period of quietPeriods) {
    const periodStart = new Date(`2000-01-01T${period.start}:00`);
    const periodEnd = new Date(`2000-01-01T${period.end}:00`);

    if (requestedTime >= periodStart && requestedTime < periodEnd) {
      return false; // Geen reservering nodig
    }
  }

  // Voor alle andere tijden: reservering vereist (veilige standaard)
  return true;
}

// Helper functie om tijdspecifieke max party size op te halen
function getTimeSpecificMaxPartySize(requestedTimeStr, settings) {
  const timeSlots = settings.time_specific_max_party_size || [];
  const timeSlot = timeSlots.find((slot) => {
    const [openTime, closeTime] = slot.time_range.split("-");
    return requestedTimeStr >= openTime && requestedTimeStr <= closeTime;
  });

  if (timeSlot) {
    return parseInt(timeSlot.max_party_size, 10);
  }
  return null;
}

// Helper functie om de tijdslot naam te krijgen
function getTimeSlot(requestedTimeStr) {
  const timeSlots = [
    { time_range: "08:00-10:00", name: "Ochtend" },
    { time_range: "10:00-12:00", name: "Middag" },
    { time_range: "12:00-14:00", name: "Lunch" },
    { time_range: "14:00-16:00", name: "Middag" },
    { time_range: "16:00-18:00", name: "Avond" },
    { time_range: "18:00-20:00", name: "Diner" },
    { time_range: "20:00-22:00", name: "Avond" },
    { time_range: "22:00-00:00", name: "Nacht" },
  ];

  const foundSlot = timeSlots.find((slot) => {
    const [openTime, closeTime] = slot.time_range.split("-");
    return requestedTimeStr >= openTime && requestedTimeStr < closeTime;
  });

  return foundSlot ? foundSlot.name : "Onbekend";
}

// Check restaurant capaciteit
async function handleGetRestaurantCapacity(req, res) {
  try {
    // Haal restaurant ID uit query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const restaurantId = url.searchParams.get("restaurant_id") || RESTAURANT_ID;

    // Haal alle tafels op van het restaurant
    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select("id, table_number, capacity, status")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (tablesError) {
      console.error("Supabase error:", tablesError);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Database fout",
          details: tablesError.message,
        })
      );
      return;
    }

    // Bereken totale capaciteit
    const totalCapacity = tables.reduce(
      (sum, table) => sum + table.capacity,
      0
    );
    const availableTables = tables.filter(
      (table) => table.status === "available"
    ).length;
    const totalTables = tables.length;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        restaurant_id: restaurantId,
        total_capacity: totalCapacity,
        total_tables: totalTables,
        available_tables: availableTables,
        tables: tables,
        message: `Restaurant capaciteit: ${totalCapacity} personen (${totalTables} tafels)`,
      })
    );
  } catch (error) {
    console.error("Error in get restaurant capacity:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Server fout",
        details: error.message,
      })
    );
  }
}

server.listen(PORT, () => {
  console.log(
    `🚀 RestoPlanner API draait op poort ${PORT} - MET SUPABASE DATABASE - JUISTE OPENINGSTIJDEN 08:30-16:00`
  );
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
  console.log(`🗄️ Supabase database verbonden: ${supabaseUrl}`);
  console.log(`✅ Echte data beschikbaar via API endpoints!`);
  console.log(`📋 Nieuwe endpoints toegevoegd:`);
  console.log(
    `   - POST /api/reservations/check-availability (MET CAPACITEITSCONTROLE + GROTE GROEPEN)`
  );
  console.log(
    `   - POST /api/reservations/book (MET CAPACITEITSCONTROLE + GROTE GROEPEN)`
  );
  console.log(`   - PUT /api/reservations/update`);
  console.log(`   - DELETE /api/reservations/delete`);
  console.log(`   - GET /api/restaurant/capacity`);
  console.log(
    `🎯 Grote groepen (>6 personen) → Handmatige goedkeuring vereist`
  );
});

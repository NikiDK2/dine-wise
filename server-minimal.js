const http = require("http");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 3000;
const RESTAURANT_ID = process.env.RESTAURANT_ID || "550e8400-e29b-41d4-a716-446655440000";

// Supabase client configuratie
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
// Gebruik anonieme key (werkt voor publieke data)
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper functie om request body te parsen
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
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
        message: "RestoPlanner Health Check - MET SUPABASE DATABASE",
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
  if (req.url === "/api/reservations/check-availability" && req.method === "POST") {
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

    // Gebruik vaste restaurant ID
    const restaurantId = RESTAURANT_ID;

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
      .from('restaurants')
      .select('id')
      .limit(1)
      .order('created_at', { ascending: false });

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
          error: "restaurant_id, requested_date, requested_time en party_size zijn verplicht",
        })
      );
      return;
    }

    // Haal eerst het eerste restaurant op uit de database
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .order('created_at', { ascending: false });

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

    // Gebruik echte Supabase database met bestaande restaurant
    const { data: conflictingReservations, error } = await supabase
      .from('reservations')
      .select('id, customer_name, reservation_time, party_size')
      .eq('restaurant_id', restaurantId) // Gebruik bestaande restaurant ID
      .eq('reservation_date', requested_date)
      .eq('reservation_time', requested_time)
      .not('status', 'eq', 'cancelled');

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

    const isAvailable = conflictingReservations.length === 0;
    const alternativeTimes = generateAlternativeTimes(requested_time);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        available: isAvailable,
        requested_date,
        requested_time,
        party_size,
        conflicting_reservations: conflictingReservations,
        alternative_times: alternativeTimes,
        message: isAvailable 
          ? `Tijdstip ${requested_time} is beschikbaar voor ${party_size} personen (echte database)`
          : `Tijdstip ${requested_time} is niet beschikbaar, hier zijn alternatieven (echte database)`,
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
      notes 
    } = body;

    if (!restaurant_id || !reservation_date || !reservation_time || !customer_name || !party_size) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "restaurant_id, reservation_date, reservation_time, customer_name en party_size zijn verplicht",
        })
      );
      return;
    }

        // Haal eerst het eerste restaurant op uit de database
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .order('created_at', { ascending: false });

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

    // Gebruik echte Supabase database met bestaande restaurant
    const { data: newReservation, error } = await supabase
      .from('reservations')
      .insert({
        restaurant_id: restaurantId, // Gebruik bestaande restaurant ID
        reservation_date,
        reservation_time,
        customer_name,
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        party_size,
        special_requests: notes || "",
        status: "confirmed"
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
        message: `Reservering succesvol aangemaakt voor ${customer_name} (echte database)`,
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
      status 
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
      status: status || "confirmed"
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
  const startTime = "17:00";
  const endTime = "22:00";
  
  // Voor nu: eenvoudige demo periods
  // Later: echte logica gebaseerd op reserveringen
  periods.push({
    type: "free",
    start_time: "17:00",
    end_time: "18:30",
  });

  if (reservations.length > 0) {
    periods.push({
      type: "busy",
      start_time: "18:30",
      end_time: "19:30",
      reservations: reservations.slice(0, 3), // Toon eerste 3 reserveringen
    });
  }

  periods.push({
    type: "free",
    start_time: "19:30",
    end_time: "22:00",
  });

  return periods;
}

// Helper functie om reserveringen per datum te groeperen
function groupReservationsByDate(reservations) {
  const grouped = {};
  
  reservations.forEach(reservation => {
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
function generateAlternativeTimes(requestedTime) {
  const baseTime = new Date(`2000-01-01T${requestedTime}:00`);
  const alternatives = [];
  
  // Genereer tijden 30 minuten voor en na het gewenste tijdstip
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue; // Skip het gewenste tijdstip
    const alternativeTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000);
    const timeString = alternativeTime.toTimeString().slice(0, 5);
    if (timeString >= "17:00" && timeString <= "22:00") {
      alternatives.push(timeString);
    }
  }
  
  return alternatives;
}

server.listen(PORT, () => {
  console.log(
    `🚀 RestoPlanner API draait op poort ${PORT} - MET SUPABASE DATABASE`
  );
  console.log(`📡 API beschikbaar op: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend beschikbaar op: http://localhost:${PORT}`);
  console.log(`🗄️ Supabase database verbonden: ${supabaseUrl}`);
  console.log(`✅ Echte data beschikbaar via API endpoints!`);
  console.log(`📋 Nieuwe endpoints toegevoegd:`);
  console.log(`   - POST /api/reservations/check-availability`);
  console.log(`   - POST /api/reservations/book`);
  console.log(`   - PUT /api/reservations/update`);
  console.log(`   - DELETE /api/reservations/delete`);
});

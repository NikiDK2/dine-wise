import { createClient } from "@supabase/supabase-js";
import express from "express";

// Supabase client configuratie voor online deployment
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://uhrwgjwgdgpgrzbdodgr.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU";

// Log configuratie voor debugging
console.log("🔧 Supabase Config:", {
  url: supabaseUrl,
  key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "MISSING",
  env: process.env.NODE_ENV || "development",
});

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Voor server-side geen session persistence nodig
    autoRefreshToken: false,
  },
});

const router = express.Router();

// Middleware voor authenticatie (optioneel voor Make.com)
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Voor Make.com kunnen we authenticatie overslaan of een API key gebruiken
    return res.status(401).json({ error: "Geen geldige authenticatie token" });
  }

  const token = authHeader.substring(7);
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Ongeldige token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authenticatie mislukt" });
  }
};

// Helper functie om beschikbaarheid te controleren
const checkAvailability = async (
  restaurant_id,
  requested_date,
  requested_time,
  party_size,
  exclude_reservation_id = null
) => {
  try {
    // Haal alle reserveringen op voor de gevraagde datum
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .eq("reservation_date", requested_date)
      .not("status", "eq", "cancelled");

    if (exclude_reservation_id) {
      query = query.neq("id", exclude_reservation_id);
    }

    const { data: existingReservations, error } = await query;
    if (error) throw error;

    // Controleer of het gevraagde tijdstip vrij is
    const requestedDateTime = new Date(
      `${requested_date}T${requested_time}:00`
    );
    const requestedEndTime = new Date(
      requestedDateTime.getTime() + 60 * 60 * 1000
    ); // 1 uur later

    const conflictingReservations =
      existingReservations?.filter((reservation) => {
        const reservationTime = new Date(
          `${reservation.reservation_date}T${reservation.reservation_time}:00`
        );
        const reservationEndTime = new Date(
          reservationTime.getTime() + 60 * 60 * 1000
        );

        return (
          (requestedDateTime < reservationEndTime &&
            requestedEndTime > reservationTime) ||
          (reservationTime < requestedEndTime &&
            reservationEndTime > requestedDateTime)
        );
      }) || [];

    return {
      available: conflictingReservations.length === 0,
      conflicting_reservations: conflictingReservations,
      requested_time: requested_time,
      requested_date: requested_date,
    };
  } catch (error) {
    throw error;
  }
};

// Helper functie om alternatieve tijdstippen te vinden
const findAlternativeTimes = async (
  restaurant_id,
  requested_date,
  party_size
) => {
  try {
    // Haal alle reserveringen op voor de gevraagde datum
    const { data: existingReservations, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .eq("reservation_date", requested_date)
      .not("status", "eq", "cancelled");

    if (error) throw error;

    // Genereer tijdstippen van 17:00 tot 22:00 (restaurant openingstijden)
    const availableTimes = [];
    const startHour = 17; // 17:00
    const endHour = 22; // 22:00

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Elke 30 minuten
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const timeDateTime = new Date(`${requested_date}T${timeString}:00`);
        const timeEndDateTime = new Date(
          timeDateTime.getTime() + 60 * 60 * 1000
        );

        // Controleer of dit tijdstip vrij is
        const conflictingReservations =
          existingReservations?.filter((reservation) => {
            const reservationTime = new Date(
              `${reservation.reservation_date}T${reservation.reservation_time}:00`
            );
            const reservationEndTime = new Date(
              reservationTime.getTime() + 60 * 60 * 1000
            );

            return (
              (timeDateTime < reservationEndTime &&
                timeEndDateTime > reservationTime) ||
              (reservationTime < timeEndDateTime &&
                reservationEndTime > timeDateTime)
            );
          }) || [];

        if (conflictingReservations.length === 0) {
          availableTimes.push(timeString);
        }
      }
    }

    return availableTimes.slice(0, 5); // Return max 5 alternatieven
  } catch (error) {
    throw error;
  }
};

// POST /api/agenda/check-and-book - Make.com integratie endpoint
router.post("/check-and-book", async (req, res) => {
  try {
    const {
      restaurant_id,
      requested_date,
      requested_time,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      notes,
      auto_book = false, // Als true, boek automatisch als beschikbaar
    } = req.body;

    // Validatie
    if (
      !restaurant_id ||
      !requested_date ||
      !requested_time ||
      !customer_name
    ) {
      return res.status(400).json({
        error:
          "restaurant_id, requested_date, requested_time en customer_name zijn verplicht",
      });
    }

    // Controleer beschikbaarheid
    const availability = await checkAvailability(
      restaurant_id,
      requested_date,
      requested_time,
      party_size
    );

    if (availability.available) {
      // Tijdstip is beschikbaar
      if (auto_book) {
        // Maak automatisch een reservering aan
        const { data: newReservation, error: bookingError } = await supabase
          .from("reservations")
          .insert([
            {
              customer_name,
              customer_email,
              customer_phone,
              party_size: party_size || 1,
              reservation_date: requested_date,
              reservation_time: requested_time,
              restaurant_id,
              notes,
              status: "confirmed",
              special_requests: `Automatisch geboekt via Make.com - ${new Date().toISOString()}`,
            },
          ])
          .select()
          .single();

        if (bookingError) throw bookingError;

        return res.status(200).json({
          success: true,
          available: true,
          booked: true,
          reservation: {
            id: newReservation.id,
            customer_name: newReservation.customer_name,
            reservation_date: newReservation.reservation_date,
            reservation_time: newReservation.reservation_time,
            party_size: newReservation.party_size,
            status: newReservation.status,
          },
          message: "Reservering succesvol aangemaakt",
        });
      } else {
        // Alleen beschikbaarheid bevestigen
        return res.status(200).json({
          success: true,
          available: true,
          booked: false,
          requested_date,
          requested_time,
          message: "Tijdstip is beschikbaar",
        });
      }
    } else {
      // Tijdstip is niet beschikbaar, zoek alternatieven
      const alternativeTimes = await findAlternativeTimes(
        restaurant_id,
        requested_date,
        party_size
      );

      return res.status(200).json({
        success: true,
        available: false,
        booked: false,
        requested_date,
        requested_time,
        conflicting_reservations: availability.conflicting_reservations.map(
          (r) => ({
            id: r.id,
            customer_name: r.customer_name,
            reservation_time: r.reservation_time,
            party_size: r.party_size,
          })
        ),
        alternative_times: alternativeTimes,
        message: "Tijdstip is niet beschikbaar, hier zijn alternatieven",
      });
    }
  } catch (error) {
    console.error("Error in check-and-book:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message:
        "Er is een fout opgetreden bij het controleren van beschikbaarheid",
    });
  }
});

// POST /api/agenda/check-availability - Alleen beschikbaarheid controleren
router.post("/check-availability", async (req, res) => {
  try {
    const { restaurant_id, requested_date, requested_time, party_size } =
      req.body;

    if (!restaurant_id || !requested_date || !requested_time) {
      return res.status(400).json({
        error: "restaurant_id, requested_date en requested_time zijn verplicht",
      });
    }

    const availability = await checkAvailability(
      restaurant_id,
      requested_date,
      requested_time,
      party_size
    );

    if (availability.available) {
      return res.status(200).json({
        success: true,
        available: true,
        requested_date,
        requested_time,
        message: "Tijdstip is beschikbaar",
      });
    } else {
      const alternativeTimes = await findAlternativeTimes(
        restaurant_id,
        requested_date,
        party_size
      );

      return res.status(200).json({
        success: true,
        available: false,
        requested_date,
        requested_time,
        conflicting_reservations: availability.conflicting_reservations.map(
          (r) => ({
            id: r.id,
            customer_name: r.customer_name,
            reservation_time: r.reservation_time,
            party_size: r.party_size,
          })
        ),
        alternative_times: alternativeTimes,
        message: "Tijdstip is niet beschikbaar",
      });
    }
  } catch (error) {
    console.error("Error in check-availability:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Er is een fout opgetreden",
    });
  }
});

// POST /api/agenda/book - Direct boeken zonder beschikbaarheid check
router.post("/book", async (req, res) => {
  try {
    const {
      restaurant_id,
      reservation_date,
      reservation_time,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      notes,
      status = "confirmed",
    } = req.body;

    if (
      !restaurant_id ||
      !reservation_date ||
      !reservation_time ||
      !customer_name
    ) {
      return res.status(400).json({
        error:
          "restaurant_id, reservation_date, reservation_time en customer_name zijn verplicht",
      });
    }

    const { data: newReservation, error } = await supabase
      .from("reservations")
      .insert([
        {
          customer_name,
          customer_email,
          customer_phone,
          party_size: party_size || 1,
          reservation_date,
          reservation_time,
          restaurant_id,
          notes,
          status,
          special_requests: `Geboekt via Make.com - ${new Date().toISOString()}`,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      reservation: {
        id: newReservation.id,
        customer_name: newReservation.customer_name,
        reservation_date: newReservation.reservation_date,
        reservation_time: newReservation.reservation_time,
        party_size: newReservation.party_size,
        status: newReservation.status,
      },
      message: "Reservering succesvol aangemaakt",
    });
  } catch (error) {
    console.error("Error in book:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Er is een fout opgetreden bij het maken van de reservering",
    });
  }
});

// GET /api/agenda/available-times - Haal beschikbare tijdstippen op voor een datum
router.get("/available-times", async (req, res) => {
  try {
    const { restaurant_id, date, party_size } = req.query;

    if (!restaurant_id || !date) {
      return res.status(400).json({
        error: "restaurant_id en date zijn verplicht",
      });
    }

    const availableTimes = await findAlternativeTimes(
      restaurant_id,
      date,
      party_size
    );

    res.status(200).json({
      success: true,
      date,
      available_times: availableTimes,
      message: `Beschikbare tijdstippen voor ${date}`,
    });
  } catch (error) {
    console.error("Error in available-times:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Er is een fout opgetreden",
    });
  }
});

// GET /api/agenda/appointments - Haal alle afspraken op
router.get("/appointments", async (req, res) => {
  try {
    const { restaurant_id, start_date, end_date, status, type, customer_name } =
      req.query;

    if (!restaurant_id) {
      return res.status(400).json({ error: "restaurant_id is verplicht" });
    }

    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .order("reservation_date", { ascending: true });

    if (start_date) {
      query = query.gte("reservation_date", start_date);
    }
    if (end_date) {
      query = query.lte("reservation_date", end_date);
    }
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      const validStatuses = statusArray.filter((s) =>
        [
          "pending",
          "completed",
          "confirmed",
          "seated",
          "cancelled",
          "no_show",
        ].includes(s)
      );
      if (validStatuses.length > 0) {
        query = query.in("status", validStatuses);
      }
    }
    if (customer_name) {
      query = query.ilike("customer_name", `%${customer_name}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const appointments = (data || []).map((reservation) => ({
      id: reservation.id,
      title: `${reservation.customer_name} - ${reservation.party_size} personen`,
      description: reservation.special_requests,
      start_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`,
      end_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`,
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email,
      customer_phone: reservation.customer_phone,
      status: reservation.status,
      type: "reservation",
      party_size: reservation.party_size,
      table_id: reservation.table_id,
      notes: reservation.notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      restaurant_id: reservation.restaurant_id,
    }));

    res.json({
      success: true,
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error in appointments:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /api/agenda/appointments/:id - Update afspraak
router.put("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatePayload = {};
    if (updates.customer_name)
      updatePayload.customer_name = updates.customer_name;
    if (updates.customer_email)
      updatePayload.customer_email = updates.customer_email;
    if (updates.customer_phone)
      updatePayload.customer_phone = updates.customer_phone;
    if (updates.party_size) updatePayload.party_size = updates.party_size;
    if (updates.table_id) updatePayload.table_id = updates.table_id;
    if (updates.notes) updatePayload.notes = updates.notes;
    if (updates.status) updatePayload.status = updates.status;
    if (updates.description)
      updatePayload.special_requests = updates.description;
    if (updates.start_time) {
      updatePayload.reservation_date = updates.start_time.split("T")[0];
      updatePayload.reservation_time = updates.start_time
        .split("T")[1]
        .substring(0, 5);
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const appointment = {
      id: data.id,
      title: `${data.customer_name} - ${data.party_size} personen`,
      description: data.special_requests,
      start_time: `${data.reservation_date}T${data.reservation_time}:00`,
      end_time: `${data.reservation_date}T${data.reservation_time}:00`,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      status: data.status,
      type: "reservation",
      party_size: data.party_size,
      table_id: data.table_id,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      restaurant_id: data.restaurant_id,
    };

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error in update appointment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/agenda/appointments/:id - Verwijder afspraak
router.delete("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Reservering succesvol verwijderd",
    });
  } catch (error) {
    console.error("Error in delete appointment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/agenda/stats - Haal statistieken op
router.get("/stats", async (req, res) => {
  try {
    const { restaurant_id, start_date, end_date } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ error: "restaurant_id is verplicht" });
    }

    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id);

    if (start_date) {
      query = query.gte("reservation_date", start_date);
    }
    if (end_date) {
      query = query.lte("reservation_date", end_date);
    }

    const { data: reservations, error } = await query;
    if (error) throw error;

    const stats = {
      total: reservations?.length || 0,
      by_status: {
        scheduled:
          reservations?.filter((r) => r.status === "pending").length || 0,
        confirmed:
          reservations?.filter((r) => r.status === "confirmed").length || 0,
        cancelled:
          reservations?.filter((r) => r.status === "cancelled").length || 0,
        completed:
          reservations?.filter((r) => r.status === "completed").length || 0,
      },
      by_type: {
        reservation: reservations?.length || 0,
        meeting: 0,
        event: 0,
        maintenance: 0,
      },
      total_party_size:
        reservations?.reduce((sum, r) => sum + r.party_size, 0) || 0,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error in stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /health - Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    message: "RestoPlanner API is actief",
    timestamp: new Date().toISOString(),
  });
});

export default router;

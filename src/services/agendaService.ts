import { supabase } from "../integrations/supabase/client";

export interface AgendaAppointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
  type: "reservation" | "meeting" | "event" | "maintenance";
  party_size?: number;
  table_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  restaurant_id: string;
}

export interface CreateAppointmentRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  type: "reservation" | "meeting" | "event" | "maintenance";
  party_size?: number;
  table_id?: string;
  notes?: string;
  restaurant_id: string;
}

export interface UpdateAppointmentRequest {
  id: string;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status?: "scheduled" | "confirmed" | "cancelled" | "completed";
  type?: "reservation" | "meeting" | "event" | "maintenance";
  party_size?: number;
  table_id?: string;
  notes?: string;
}

export interface AvailabilityRequest {
  start_date: string;
  end_date: string;
  restaurant_id: string;
  party_size?: number;
  exclude_appointment_id?: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
  conflicting_appointments?: AgendaAppointment[];
}

export interface AgendaFilters {
  start_date?: string;
  end_date?: string;
  status?: string[];
  type?: string[];
  customer_name?: string;
  restaurant_id: string;
}

class AgendaService {
  private tableName = "agenda_appointments";

  /**
   * Maak een nieuwe afspraak aan
   */
  async createAppointment(
    appointment: CreateAppointmentRequest
  ): Promise<AgendaAppointment> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([appointment])
        .select()
        .single();

      if (error) {
        console.error("Error creating appointment:", error);
        throw new Error(`Kon afspraak niet aanmaken: ${error.message}`);
      }

      return data as AgendaAppointment;
    } catch (error) {
      console.error("Error in createAppointment:", error);
      throw error;
    }
  }

  /**
   * Haal een specifieke afspraak op
   */
  async getAppointment(id: string): Promise<AgendaAppointment> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching appointment:", error);
        throw new Error(`Kon afspraak niet ophalen: ${error.message}`);
      }

      return data as AgendaAppointment;
    } catch (error) {
      console.error("Error in getAppointment:", error);
      throw error;
    }
  }

  /**
   * Haal alle afspraken op met filters
   */
  async getAppointments(filters: AgendaFilters): Promise<AgendaAppointment[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select("*")
        .eq("restaurant_id", filters.restaurant_id)
        .order("start_time", { ascending: true });

      // Voeg filters toe
      if (filters.start_date) {
        query = query.gte("start_time", filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte("end_time", filters.end_date);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }
      if (filters.type && filters.type.length > 0) {
        query = query.in("type", filters.type);
      }
      if (filters.customer_name) {
        query = query.ilike("customer_name", `%${filters.customer_name}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching appointments:", error);
        throw new Error(`Kon afspraken niet ophalen: ${error.message}`);
      }

      return (data || []) as AgendaAppointment[];
    } catch (error) {
      console.error("Error in getAppointments:", error);
      throw error;
    }
  }

  /**
   * Update een bestaande afspraak
   */
  async updateAppointment(
    updateData: UpdateAppointmentRequest
  ): Promise<AgendaAppointment> {
    try {
      const { id, ...updates } = updateData;

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating appointment:", error);
        throw new Error(`Kon afspraak niet bijwerken: ${error.message}`);
      }

      return data as AgendaAppointment;
    } catch (error) {
      console.error("Error in updateAppointment:", error);
      throw error;
    }
  }

  /**
   * Verwijder een afspraak
   */
  async deleteAppointment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting appointment:", error);
        throw new Error(`Kon afspraak niet verwijderen: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deleteAppointment:", error);
      throw error;
    }
  }

  /**
   * Controleer beschikbaarheid voor een bepaalde periode
   */
  async checkAvailability(
    request: AvailabilityRequest
  ): Promise<AvailabilitySlot[]> {
    try {
      const {
        start_date,
        end_date,
        restaurant_id,
        party_size,
        exclude_appointment_id,
      } = request;

      // Haal alle bestaande afspraken op in de periode
      let query = supabase
        .from(this.tableName)
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .gte("start_time", start_date)
        .lte("end_time", end_date)
        .not("status", "eq", "cancelled");

      if (exclude_appointment_id) {
        query = query.neq("id", exclude_appointment_id);
      }

      const { data: existingAppointments, error } = await query;

      if (error) {
        console.error("Error checking availability:", error);
        throw new Error(
          `Kon beschikbaarheid niet controleren: ${error.message}`
        );
      }

      // Genereer tijdslots van 30 minuten
      const slots: AvailabilitySlot[] = [];
      const start = new Date(start_date);
      const end = new Date(end_date);

      for (
        let time = new Date(start);
        time < end;
        time.setMinutes(time.getMinutes() + 30)
      ) {
        const slotStart = new Date(time);
        const slotEnd = new Date(time.getTime() + 30 * 60 * 1000); // 30 minuten later

        // Controleer conflicten
        const conflictingAppointments =
          existingAppointments?.filter((appointment) => {
            const appointmentStart = new Date(appointment.start_time);
            const appointmentEnd = new Date(appointment.end_time);

            return (
              (slotStart < appointmentEnd && slotEnd > appointmentStart) ||
              (appointmentStart < slotEnd && appointmentEnd > slotStart)
            );
          }) || [];

        const available = conflictingAppointments.length === 0;

        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          available,
          conflicting_appointments: available
            ? undefined
            : (conflictingAppointments as AgendaAppointment[]),
        });
      }

      return slots;
    } catch (error) {
      console.error("Error in checkAvailability:", error);
      throw error;
    }
  }

  /**
   * Haal agenda statistieken op
   */
  async getAgendaStats(
    restaurant_id: string,
    start_date?: string,
    end_date?: string
  ) {
    try {
      let query = supabase
        .from(this.tableName)
        .select("*")
        .eq("restaurant_id", restaurant_id);

      if (start_date) {
        query = query.gte("start_time", start_date);
      }
      if (end_date) {
        query = query.lte("end_time", end_date);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error("Error fetching agenda stats:", error);
        throw new Error(
          `Kon agenda statistieken niet ophalen: ${error.message}`
        );
      }

      const agendaAppointments = appointments as AgendaAppointment[];

      const stats = {
        total: agendaAppointments?.length || 0,
        by_status: {
          scheduled:
            agendaAppointments?.filter((a) => a.status === "scheduled")
              .length || 0,
          confirmed:
            agendaAppointments?.filter((a) => a.status === "confirmed")
              .length || 0,
          cancelled:
            agendaAppointments?.filter((a) => a.status === "cancelled")
              .length || 0,
          completed:
            agendaAppointments?.filter((a) => a.status === "completed")
              .length || 0,
        },
        by_type: {
          reservation:
            agendaAppointments?.filter((a) => a.type === "reservation")
              .length || 0,
          meeting:
            agendaAppointments?.filter((a) => a.type === "meeting").length || 0,
          event:
            agendaAppointments?.filter((a) => a.type === "event").length || 0,
          maintenance:
            agendaAppointments?.filter((a) => a.type === "maintenance")
              .length || 0,
        },
        total_party_size:
          agendaAppointments?.reduce(
            (sum, a) => sum + (a.party_size || 0),
            0
          ) || 0,
      };

      return stats;
    } catch (error) {
      console.error("Error in getAgendaStats:", error);
      throw error;
    }
  }

  /**
   * Zoek afspraken op klantnaam of email
   */
  async searchAppointments(
    searchTerm: string,
    restaurant_id: string
  ): Promise<AgendaAppointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .or(
          `customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
        )
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error searching appointments:", error);
        throw new Error(`Kon afspraken niet zoeken: ${error.message}`);
      }

      return (data || []) as AgendaAppointment[];
    } catch (error) {
      console.error("Error in searchAppointments:", error);
      throw error;
    }
  }

  /**
   * Bulk update van afspraken (bijvoorbeeld voor status wijzigingen)
   */
  async bulkUpdateAppointments(
    appointmentIds: string[],
    updates: Partial<UpdateAppointmentRequest>
  ): Promise<AgendaAppointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in("id", appointmentIds)
        .select();

      if (error) {
        console.error("Error bulk updating appointments:", error);
        throw new Error(`Kon afspraken niet bulk bijwerken: ${error.message}`);
      }

      return (data || []) as AgendaAppointment[];
    } catch (error) {
      console.error("Error in bulkUpdateAppointments:", error);
      throw error;
    }
  }

  /**
   * Exporteer agenda data naar CSV
   */
  async exportAgendaData(filters: AgendaFilters): Promise<string> {
    try {
      const appointments = await this.getAppointments(filters);

      // CSV header
      const headers = [
        "ID",
        "Titel",
        "Beschrijving",
        "Start Tijd",
        "Eind Tijd",
        "Klant Naam",
        "Klant Email",
        "Klant Telefoon",
        "Status",
        "Type",
        "Aantal Personen",
        "Tafel ID",
        "Notities",
        "Aangemaakt Op",
        "Bijgewerkt Op",
      ];

      // CSV rijen
      const rows = appointments.map((appointment) => [
        appointment.id,
        appointment.title,
        appointment.description || "",
        appointment.start_time,
        appointment.end_time,
        appointment.customer_name,
        appointment.customer_email || "",
        appointment.customer_phone || "",
        appointment.status,
        appointment.type,
        appointment.party_size || "",
        appointment.table_id || "",
        appointment.notes || "",
        appointment.created_at,
        appointment.updated_at,
      ]);

      // Combineer header en rijen
      const csvContent = [headers, ...rows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("Error in exportAgendaData:", error);
      throw error;
    }
  }
}

export const agendaService = new AgendaService();

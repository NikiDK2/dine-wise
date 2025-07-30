import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "./use-toast";

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

export interface AgendaFilters {
  start_date?: string;
  end_date?: string;
  status?: string[];
  type?: string[];
  customer_name?: string;
  restaurant_id: string;
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

// Agenda service functions
const agendaService = {
  async createAppointment(
    appointment: CreateAppointmentRequest
  ): Promise<AgendaAppointment> {
    // Voor nu gebruiken we de reservations tabel als agenda
    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          customer_name: appointment.customer_name,
          customer_email: appointment.customer_email,
          customer_phone: appointment.customer_phone,
          party_size: appointment.party_size || 1,
          reservation_date: appointment.start_time.split("T")[0],
          reservation_time: appointment.start_time
            .split("T")[1]
            .substring(0, 5),
          restaurant_id: appointment.restaurant_id,
          notes: appointment.notes,
          status: appointment.status || "confirmed",
          table_id: appointment.table_id,
          special_requests: appointment.description,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Convert reservation to agenda appointment format
    return {
      id: data.id,
      title: appointment.title,
      description: appointment.description,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      status: data.status as any,
      type: appointment.type,
      party_size: data.party_size,
      table_id: data.table_id,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      restaurant_id: data.restaurant_id,
    };
  },

  async getAppointments(filters: AgendaFilters): Promise<AgendaAppointment[]> {
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", filters.restaurant_id)
      .order("reservation_date", { ascending: true });

    if (filters.start_date) {
      query = query.gte("reservation_date", filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte("reservation_date", filters.end_date);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }
    if (filters.customer_name) {
      query = query.ilike("customer_name", `%${filters.customer_name}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Convert reservations to agenda appointments
    return (data || []).map((reservation) => ({
      id: reservation.id,
      title: `${reservation.customer_name} - ${reservation.party_size} personen`,
      description: reservation.special_requests,
      start_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`,
      end_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`, // Default 1 hour
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email,
      customer_phone: reservation.customer_phone,
      status: reservation.status as any,
      type: "reservation" as const,
      party_size: reservation.party_size,
      table_id: reservation.table_id,
      notes: reservation.notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      restaurant_id: reservation.restaurant_id,
    }));
  },

  async updateAppointment(
    updateData: UpdateAppointmentRequest
  ): Promise<AgendaAppointment> {
    const { id, ...updates } = updateData;

    const updatePayload: any = {};
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

    return {
      id: data.id,
      title: `${data.customer_name} - ${data.party_size} personen`,
      description: data.special_requests,
      start_time: `${data.reservation_date}T${data.reservation_time}:00`,
      end_time: `${data.reservation_date}T${data.reservation_time}:00`,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      status: data.status as any,
      type: "reservation" as const,
      party_size: data.party_size,
      table_id: data.table_id,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      restaurant_id: data.restaurant_id,
    };
  },

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) throw error;
  },

  async checkAvailability(
    request: AvailabilityRequest
  ): Promise<AvailabilitySlot[]> {
    const { start_date, end_date, restaurant_id, exclude_appointment_id } =
      request;

    // Haal alle bestaande reserveringen op in de periode
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .gte("reservation_date", start_date.split("T")[0])
      .lte("reservation_date", end_date.split("T")[0])
      .not("status", "eq", "cancelled");

    if (exclude_appointment_id) {
      query = query.neq("id", exclude_appointment_id);
    }

    const { data: existingReservations, error } = await query;
    if (error) throw error;

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
      const slotEnd = new Date(time.getTime() + 30 * 60 * 1000);

      // Controleer conflicten
      const conflictingReservations =
        existingReservations?.filter((reservation) => {
          const reservationTime = new Date(
            `${reservation.reservation_date}T${reservation.reservation_time}:00`
          );
          const reservationEnd = new Date(
            reservationTime.getTime() + 60 * 60 * 1000
          ); // 1 hour default

          return (
            (slotStart < reservationEnd && slotEnd > reservationTime) ||
            (reservationTime < slotEnd && reservationEnd > slotStart)
          );
        }) || [];

      const available = conflictingReservations.length === 0;

      slots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        available,
        conflicting_appointments: available
          ? undefined
          : conflictingReservations.map((r) => ({
              id: r.id,
              title: `${r.customer_name} - ${r.party_size} personen`,
              description: r.special_requests,
              start_time: `${r.reservation_date}T${r.reservation_time}:00`,
              end_time: `${r.reservation_date}T${r.reservation_time}:00`,
              customer_name: r.customer_name,
              customer_email: r.customer_email,
              customer_phone: r.customer_phone,
              status: r.status as any,
              type: "reservation" as const,
              party_size: r.party_size,
              table_id: r.table_id,
              notes: r.notes,
              created_at: r.created_at,
              updated_at: r.updated_at,
              restaurant_id: r.restaurant_id,
            })),
      });
    }

    return slots;
  },

  async getAgendaStats(
    restaurant_id: string,
    start_date?: string,
    end_date?: string
  ) {
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

    return {
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
  },

  async searchAppointments(
    searchTerm: string,
    restaurant_id: string
  ): Promise<AgendaAppointment[]> {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .or(
        `customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
      )
      .order("reservation_date", { ascending: true });

    if (error) throw error;

    return (data || []).map((reservation) => ({
      id: reservation.id,
      title: `${reservation.customer_name} - ${reservation.party_size} personen`,
      description: reservation.special_requests,
      start_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`,
      end_time: `${reservation.reservation_date}T${reservation.reservation_time}:00`,
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email,
      customer_phone: reservation.customer_phone,
      status: reservation.status as any,
      type: "reservation" as const,
      party_size: reservation.party_size,
      table_id: reservation.table_id,
      notes: reservation.notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      restaurant_id: reservation.restaurant_id,
    }));
  },
};

// React hooks
export function useAgendaAppointments(filters: AgendaFilters) {
  return useQuery({
    queryKey: ["agenda-appointments", filters],
    queryFn: () => agendaService.getAppointments(filters),
  });
}

export function useCreateAgendaAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (appointment: CreateAppointmentRequest) =>
      agendaService.createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast({
        title: "Afspraak Aangemaakt",
        description: "De afspraak is succesvol aangemaakt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: `Kon afspraak niet aanmaken: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAgendaAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updateData: UpdateAppointmentRequest) =>
      agendaService.updateAppointment(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast({
        title: "Afspraak Bijgewerkt",
        description: "De afspraak is succesvol bijgewerkt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: `Kon afspraak niet bijwerken: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAgendaAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => agendaService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast({
        title: "Afspraak Verwijderd",
        description: "De afspraak is succesvol verwijderd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: `Kon afspraak niet verwijderen: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useCheckAvailability() {
  return useMutation({
    mutationFn: (request: AvailabilityRequest) =>
      agendaService.checkAvailability(request),
  });
}

export function useAgendaStats(
  restaurant_id: string,
  start_date?: string,
  end_date?: string
) {
  return useQuery({
    queryKey: ["agenda-stats", restaurant_id, start_date, end_date],
    queryFn: () =>
      agendaService.getAgendaStats(restaurant_id, start_date, end_date),
  });
}

export function useSearchAgendaAppointments() {
  return useMutation({
    mutationFn: ({
      searchTerm,
      restaurant_id,
    }: {
      searchTerm: string;
      restaurant_id: string;
    }) => agendaService.searchAppointments(searchTerm, restaurant_id),
  });
}

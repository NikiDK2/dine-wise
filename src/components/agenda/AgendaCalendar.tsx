import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  useAgendaAppointments,
  useCreateAgendaAppointment,
  useUpdateAgendaAppointment,
  useDeleteAgendaAppointment,
  useCheckAvailability,
  useAgendaStats,
  type AgendaAppointment,
  type CreateAppointmentRequest,
  type UpdateAppointmentRequest,
} from "../../hooks/useAgenda";
import { useAuth } from "../../hooks/useAuth";
import { useRestaurants } from "../../hooks/useRestaurants";
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon } from "lucide-react";

const locales = {
  nl: nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AgendaCalendarProps {
  restaurantId?: string;
}

export function AgendaCalendar({ restaurantId }: AgendaCalendarProps) {
  const { user } = useAuth();
  const { selectedRestaurant } = useRestaurants();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AgendaAppointment | null>(null);

  const currentRestaurantId = restaurantId || selectedRestaurant?.id;

  // Agenda hooks
  const { data: appointments = [], isLoading } = useAgendaAppointments({
    restaurant_id: currentRestaurantId!,
    start_date: format(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      "yyyy-MM-dd"
    ),
    end_date: format(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
      "yyyy-MM-dd"
    ),
  });

  const { data: stats } = useAgendaStats(
    currentRestaurantId!,
    format(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      "yyyy-MM-dd"
    ),
    format(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
      "yyyy-MM-dd"
    )
  );

  const createAppointment = useCreateAgendaAppointment();
  const updateAppointment = useUpdateAgendaAppointment();
  const deleteAppointment = useDeleteAgendaAppointment();
  const checkAvailability = useCheckAvailability();

  // Convert appointments to calendar events
  const events = appointments.map((appointment) => ({
    id: appointment.id,
    title: appointment.title,
    start: new Date(appointment.start_time),
    end: new Date(appointment.end_time),
    resource: appointment,
  }));

  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.resource);
    setShowEditModal(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedAppointment({
      id: "",
      title: "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      customer_name: "",
      type: "reservation",
      status: "scheduled",
      restaurant_id: currentRestaurantId!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowCreateModal(true);
  };

  const handleCreateAppointment = async (
    appointmentData: CreateAppointmentRequest
  ) => {
    try {
      await createAppointment.mutateAsync(appointmentData);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  const handleUpdateAppointment = async (
    appointmentData: UpdateAppointmentRequest
  ) => {
    try {
      await updateAppointment.mutateAsync(appointmentData);
      setShowEditModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      setShowEditModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const eventStyleGetter = (event: any) => {
    const appointment = event.resource as AgendaAppointment;
    let backgroundColor = "#3b82f6"; // Default blue

    switch (appointment.status) {
      case "confirmed":
        backgroundColor = "#10b981"; // Green
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // Red
        break;
      case "completed":
        backgroundColor = "#6b7280"; // Gray
        break;
      case "scheduled":
        backgroundColor = "#f59e0b"; // Orange
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  if (!currentRestaurantId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Selecteer een restaurant om de agenda te bekijken.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Totaal
                </p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bevestigd
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.by_status.confirmed || 0}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gepland
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.by_status.scheduled || 0}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800"
              >
                ⏰
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Personen
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.total_party_size || 0}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                👥
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agenda</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nieuwe Afspraak
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              messages={{
                next: "Volgende",
                previous: "Vorige",
                today: "Vandaag",
                month: "Maand",
                week: "Week",
                day: "Dag",
                agenda: "Agenda",
                date: "Datum",
                time: "Tijd",
                event: "Afspraak",
                noEventsInRange: "Geen afspraken in deze periode.",
              }}
              culture="nl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {showCreateModal ? "Nieuwe Afspraak" : "Afspraak Bewerken"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={selectedAppointment.title}
                    onChange={(e) =>
                      setSelectedAppointment({
                        ...selectedAppointment,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Klant Naam
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={selectedAppointment.customer_name}
                    onChange={(e) =>
                      setSelectedAppointment({
                        ...selectedAppointment,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aantal Personen
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={selectedAppointment.party_size || ""}
                    onChange={(e) =>
                      setSelectedAppointment({
                        ...selectedAppointment,
                        party_size: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedAppointment.status}
                    onChange={(e) =>
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="scheduled">Gepland</option>
                    <option value="confirmed">Bevestigd</option>
                    <option value="cancelled">Geannuleerd</option>
                    <option value="completed">Voltooid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notities
                  </label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={3}
                    value={selectedAppointment.notes || ""}
                    onChange={(e) =>
                      setSelectedAppointment({
                        ...selectedAppointment,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex space-x-2">
                  {showEditModal && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        handleDeleteAppointment(selectedAppointment.id)
                      }
                      className="flex-1"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={() => {
                      if (showCreateModal) {
                        handleCreateAppointment(
                          selectedAppointment as CreateAppointmentRequest
                        );
                      } else {
                        handleUpdateAppointment(
                          selectedAppointment as UpdateAppointmentRequest
                        );
                      }
                    }}
                    className="flex-1"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    {showCreateModal ? "Aanmaken" : "Bijwerken"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

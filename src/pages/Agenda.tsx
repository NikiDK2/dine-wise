import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  useAgendaAppointments,
  useCreateAgendaAppointment,
  useUpdateAgendaAppointment,
  useDeleteAgendaAppointment,
  useAgendaStats,
  type AgendaAppointment,
  type CreateAppointmentRequest,
  type UpdateAppointmentRequest,
} from "../hooks/useAgenda";
import { useRestaurants } from "../hooks/useRestaurants";
import {
  CalendarIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Agenda() {
  const { selectedRestaurant } = useRestaurants();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AgendaAppointment | null>(null);
  const [newAppointment, setNewAppointment] = useState<
    Partial<CreateAppointmentRequest>
  >({
    title: "",
    customer_name: "",
    party_size: 1,
    status: "scheduled",
    type: "reservation",
    notes: "",
  });

  const currentRestaurantId = selectedRestaurant?.id;

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

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.customer_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAppointment = async () => {
    if (
      !currentRestaurantId ||
      !newAppointment.title ||
      !newAppointment.customer_name
    ) {
      return;
    }

    try {
      await createAppointment.mutateAsync({
        ...(newAppointment as CreateAppointmentRequest),
        restaurant_id: currentRestaurantId,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
      });

      setShowCreateModal(false);
      setNewAppointment({
        title: "",
        customer_name: "",
        party_size: 1,
        status: "scheduled",
        type: "reservation",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await updateAppointment.mutateAsync(
        selectedAppointment as UpdateAppointmentRequest
      );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bevestigd";
      case "cancelled":
        return "Geannuleerd";
      case "completed":
        return "Voltooid";
      case "scheduled":
        return "Gepland";
      default:
        return status;
    }
  };

  if (!currentRestaurantId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Selecteer een restaurant om de agenda te bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Beheer afspraken en reserveringen voor {selectedRestaurant?.name}
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nieuwe Afspraak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Afspraak</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={newAppointment.title}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      title: e.target.value,
                    })
                  }
                  placeholder="Afspraak titel"
                />
              </div>
              <div>
                <Label htmlFor="customer_name">Klant Naam</Label>
                <Input
                  id="customer_name"
                  value={newAppointment.customer_name}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customer_name: e.target.value,
                    })
                  }
                  placeholder="Naam van de klant"
                />
              </div>
              <div>
                <Label htmlFor="party_size">Aantal Personen</Label>
                <Input
                  id="party_size"
                  type="number"
                  value={newAppointment.party_size}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      party_size: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newAppointment.status}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Gepland</SelectItem>
                    <SelectItem value="confirmed">Bevestigd</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                    <SelectItem value="completed">Voltooid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Extra notities..."
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateAppointment} className="flex-1">
                  Aanmaken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Zoeken</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Zoek op klantnaam of titel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="scheduled">Gepland</SelectItem>
                  <SelectItem value="confirmed">Bevestigd</SelectItem>
                  <SelectItem value="cancelled">Geannuleerd</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Afspraken</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen afspraken gevonden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{appointment.title}</h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusLabel(appointment.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {appointment.customer_name} • {appointment.party_size}{" "}
                      personen
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {appointment.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(appointment.start_time),
                        "dd MMMM yyyy HH:mm",
                        { locale: nl }
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowEditModal(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afspraak Bewerken</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titel</Label>
                <Input
                  id="edit-title"
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
                <Label htmlFor="edit-customer-name">Klant Naam</Label>
                <Input
                  id="edit-customer-name"
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
                <Label htmlFor="edit-party-size">Aantal Personen</Label>
                <Input
                  id="edit-party-size"
                  type="number"
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
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(value) =>
                    setSelectedAppointment({
                      ...selectedAppointment,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Gepland</SelectItem>
                    <SelectItem value="confirmed">Bevestigd</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                    <SelectItem value="completed">Voltooid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notities</Label>
                <Textarea
                  id="edit-notes"
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
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeleteAppointment(selectedAppointment.id)
                  }
                  className="flex-1"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
                <Button onClick={handleUpdateAppointment} className="flex-1">
                  <EditIcon className="h-4 w-4 mr-2" />
                  Bijwerken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

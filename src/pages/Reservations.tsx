import { useState } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Phone,
  Mail,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDate } from "@/components/layout/DateContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import {
  useReservations,
  useTodayReservations,
  useUpdateReservation,
  useActiveReservations,
} from "@/hooks/useReservations";
import { CreateReservationModal } from "@/components/reservations/CreateReservationModal";
import { EditReservationModal } from "@/components/reservations/EditReservationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Reservation } from "@/hooks/useReservations";

export default function Reservations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [deleteReservationId, setDeleteReservationId] = useState<string | null>(
    null
  );
  const { data: restaurants = [] } = useRestaurants();
  const selectedRestaurant = restaurants[0];
  const { data: reservations = [] } = useReservations(selectedRestaurant?.id);
  const { data: todayReservations = [] } = useTodayReservations(
    selectedRestaurant?.id
  );
  const updateReservation = useUpdateReservation();
  const { toast } = useToast();

  // Filter reservations based on search and status
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customer_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.customer_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.customer_phone?.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || reservation.status === statusFilter;

    // Only show cancelled reservations when explicitly filtered for them
    const showCancelled = statusFilter === "cancelled";
    const isNotCancelled = reservation.status !== "cancelled";

    return matchesSearch && matchesStatus && (showCancelled || isNotCancelled);
  });

  const handleQuickStatusUpdate = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      await updateReservation.mutateAsync({
        id: reservationId,
        updates: { status: newStatus as any },
      });
      toast({
        title: "Status Bijgewerkt",
        description: "Reserveringsstatus is succesvol gewijzigd.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      await updateReservation.mutateAsync({
        id: reservationId,
        updates: { status: "cancelled" as any },
      });
      setDeleteReservationId(null);
      toast({
        title: "Reservering Geannuleerd",
        description: "De reservering is succesvol geannuleerd.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon reservering niet annuleren",
        variant: "destructive",
      });
    }
  };

  // Use active reservations for upcoming reservations (excludes cancelled)
  const { data: activeReservations = [] } = useActiveReservations(
    selectedRestaurant?.id
  );
  const upcomingReservations = activeReservations.filter((reservation) => {
    const reservationDate = new Date(reservation.reservation_date);
    const today = new Date();
    return reservationDate >= today && reservation.status !== "completed";
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Reserveringen
                </h1>
                <p className="text-muted-foreground">
                  Beheer alle restaurant reserveringen
                </p>
              </div>
              {selectedRestaurant && (
                <CreateReservationModal restaurantId={selectedRestaurant.id} />
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vandaag</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {todayReservations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    reserveringen vandaag
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Komende Week
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {upcomingReservations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    geplande reserveringen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bevestigd
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      reservations.filter((r) => r.status === "confirmed")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    bevestigde reserveringen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totaal</CardTitle>
                  <Badge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reservations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    alle reserveringen
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">
                    Alle Reserveringen ({filteredReservations.length})
                  </TabsTrigger>
                  <TabsTrigger value="today">
                    Vandaag ({todayReservations.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    Komende ({upcomingReservations.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek reserveringen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-80"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter op status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Statussen</SelectItem>
                      <SelectItem value="pending">In Afwachting</SelectItem>
                      <SelectItem value="confirmed">Bevestigd</SelectItem>
                      <SelectItem value="seated">Gearriveerd</SelectItem>
                      <SelectItem value="completed">Voltooid</SelectItem>
                      <SelectItem value="cancelled">Geannuleerd</SelectItem>
                      <SelectItem value="no_show">Niet Verschenen</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">
                                {reservation.customer_name}
                              </h3>
                              <Badge
                                variant={
                                  reservation.status === "confirmed"
                                    ? "default"
                                    : reservation.status === "pending"
                                    ? "secondary"
                                    : reservation.status === "completed"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {reservation.status === "pending"
                                  ? "In Afwachting"
                                  : reservation.status === "confirmed"
                                  ? "Bevestigd"
                                  : reservation.status === "seated"
                                  ? "Gearriveerd"
                                  : reservation.status === "completed"
                                  ? "Voltooid"
                                  : reservation.status === "cancelled"
                                  ? "Geannuleerd"
                                  : "Niet Verschenen"}
                              </Badge>
                              {reservation.restaurant_tables && (
                                <Badge variant="outline">
                                  Tafel{" "}
                                  {reservation.restaurant_tables.table_number}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(
                                    new Date(reservation.reservation_date),
                                    "EEEE d MMMM yyyy",
                                    { locale: nl }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{reservation.reservation_time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {reservation.party_size}{" "}
                                  {reservation.party_size === 1
                                    ? "persoon"
                                    : "personen"}
                                </span>
                              </div>
                            </div>

                            {(reservation.customer_email ||
                              reservation.customer_phone) && (
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                {reservation.customer_email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{reservation.customer_email}</span>
                                  </div>
                                )}
                                {reservation.customer_phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{reservation.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {reservation.special_requests && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <span className="font-medium text-blue-800">
                                  Speciale verzoeken:
                                </span>
                                <span className="ml-2 text-blue-700">
                                  {reservation.special_requests}
                                </span>
                              </div>
                            )}

                            {reservation.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="font-medium text-gray-800">
                                  Notities:
                                </span>
                                <span className="ml-2 text-gray-700">
                                  {reservation.notes}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Quick Status Actions */}
                            {reservation.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuickStatusUpdate(
                                    reservation.id,
                                    "confirmed"
                                  )
                                }
                              >
                                Bevestigen
                              </Button>
                            )}
                            {reservation.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuickStatusUpdate(
                                    reservation.id,
                                    "seated"
                                  )
                                }
                              >
                                Gearriveerd
                              </Button>
                            )}
                            {reservation.status === "seated" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuickStatusUpdate(
                                    reservation.id,
                                    "completed"
                                  )
                                }
                              >
                                Afronden
                              </Button>
                            )}

                            {/* More Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingReservation(reservation)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bewerken
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    setDeleteReservationId(reservation.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Annuleren
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredReservations.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Geen reserveringen gevonden
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm || statusFilter !== "all"
                            ? "Probeer uw zoek- of filtercriteria aan te passen."
                            : "Voeg uw eerste reservering toe om te beginnen."}
                        </p>
                        {!searchTerm &&
                          statusFilter === "all" &&
                          selectedRestaurant && (
                            <CreateReservationModal
                              restaurantId={selectedRestaurant.id}
                            />
                          )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="today" className="space-y-4">
                <div className="space-y-4">
                  {todayReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {reservation.customer_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  {reservation.reservation_time}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  {reservation.party_size} personen
                                </span>
                                {reservation.restaurant_tables && (
                                  <span>
                                    Tafel{" "}
                                    {reservation.restaurant_tables.table_number}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              {reservation.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingReservation(reservation)}
                            >
                              Bewerken
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {reservation.customer_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>
                                  {format(
                                    new Date(reservation.reservation_date),
                                    "dd MMM",
                                    { locale: nl }
                                  )}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  {reservation.reservation_time}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  {reservation.party_size} personen
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              {reservation.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingReservation(reservation)}
                            >
                              Bewerken
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Edit Reservation Modal */}
            {editingReservation && selectedRestaurant && (
              <EditReservationModal
                reservation={editingReservation}
                restaurantId={selectedRestaurant.id}
                open={!!editingReservation}
                onOpenChange={(open) => !open && setEditingReservation(null)}
              />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              open={!!deleteReservationId}
              onOpenChange={(open) => !open && setDeleteReservationId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reservering Annuleren</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet u zeker dat u deze reservering wilt annuleren? Deze
                    actie kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      deleteReservationId &&
                      handleDeleteReservation(deleteReservationId)
                    }
                  >
                    Reservering Annuleren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
}

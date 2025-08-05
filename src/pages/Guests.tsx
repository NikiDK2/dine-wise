import { useState } from "react";
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  Calendar,
  User,
  Trash2,
  Edit,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRestaurants } from "@/hooks/useRestaurants";
import {
  useCustomers,
  useDeleteAllCustomers,
  useSearchCustomers,
} from "@/hooks/useCustomers";
import { CreateCustomerModal } from "@/components/customers/CreateCustomerModal";
import { EditCustomerModal } from "@/components/customers/EditCustomerModal";
import { CsvImportModal } from "@/components/customers/CsvImportModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Guests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { data: restaurants = [] } = useRestaurants();
  const selectedRestaurant = restaurants[0] || {
    id: "29edb315-eed1-481f-9251-c113e56dbdca",
  }; // Fallback restaurant ID
  const deleteAllCustomers = useDeleteAllCustomers();

  // Gebruik search API voor alle zoektermen (inclusief lege zoekterm)
  const { data: searchResults = [] } = useSearchCustomers(
    selectedRestaurant?.id,
    searchTerm || ""
  );

  // Gebruik search API voor algemene weergave (lege zoekterm)
  const { data: allCustomers = [] } = useSearchCustomers(
    selectedRestaurant?.id,
    ""
  );

  // Combineer search results met all customers
  const displayCustomers = searchTerm ? searchResults : allCustomers;

  // Debug logging
  console.log("Debug - Restaurants:", restaurants.length);
  console.log("Debug - Selected restaurant:", selectedRestaurant);
  console.log("Debug - Search term:", searchTerm);
  console.log("Debug - Display customers:", displayCustomers.length);
  console.log("Debug - Search results:", searchResults.length);
  console.log("Debug - All customers:", allCustomers.length);
  if (displayCustomers.length > 0) {
    console.log("Debug - First customer:", displayCustomers[0]);
  }
  console.log("Debug - Edit modal open:", editModalOpen);
  console.log("Debug - Editing customer:", editingCustomer);

  const recentCustomers = displayCustomers
    .filter((customer) => customer.last_visit)
    .sort(
      (a, b) =>
        new Date(b.last_visit!).getTime() - new Date(a.last_visit!).getTime()
    )
    .slice(0, 10);

  const frequentCustomers = displayCustomers
    .filter((customer) => customer.total_visits > 0)
    .sort((a, b) => b.total_visits - a.total_visits)
    .slice(0, 10);

  const getCustomerInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastVisit = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: nl });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gasten</h1>
                <p className="text-muted-foreground">
                  Beheer uw gastendatabase en klantinformatie
                </p>
              </div>
              {selectedRestaurant && (
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={customers.length === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Alle Gasten Verwijderen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Alle gasten verwijderen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Deze actie kan niet ongedaan worden gemaakt. Dit zal
                          permanent alle {customers.length} gasten verwijderen
                          uit uw database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteAllCustomers.mutate(selectedRestaurant.id)
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteAllCustomers.isPending}
                        >
                          {deleteAllCustomers.isPending
                            ? "Verwijderen..."
                            : "Ja, Verwijder Alles"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <CreateCustomerModal restaurantId={selectedRestaurant.id} />
                  <CsvImportModal restaurantId={selectedRestaurant.id} />
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Totaal Gasten
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nieuwe Gasten (Deze Maand)
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      customers.filter((c) => {
                        const createdDate = new Date(c.created_at);
                        const now = new Date();
                        return (
                          createdDate.getMonth() === now.getMonth() &&
                          createdDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Terugkerende Gasten
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayCustomers.filter((c) => c.total_visits > 1).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gemiddeld Bezoeken
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayCustomers.length > 0
                      ? (
                          displayCustomers.reduce(
                            (sum, c) => sum + c.total_visits,
                            0
                          ) / displayCustomers.length
                        ).toFixed(1)
                      : "0"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">
                    Alle Gasten ({displayCustomers.length})
                  </TabsTrigger>
                  <TabsTrigger value="recent">
                    Recent Bezocht ({recentCustomers.length})
                  </TabsTrigger>
                  <TabsTrigger value="frequent">
                    Vaste Klanten ({frequentCustomers.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek gasten..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-80"
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4">
                  {displayCustomers.map((customer) => (
                    <Card key={customer.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {getCustomerInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {customer.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                {customer.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{customer.email}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary">
                                  {customer.total_visits} bezoek(en)
                                </Badge>
                                {customer.last_visit && (
                                  <Badge variant="outline">
                                    Laatste bezoek:{" "}
                                    {formatLastVisit(customer.last_visit)}
                                  </Badge>
                                )}
                              </div>

                              {(customer.allergies || customer.preferences) && (
                                <div className="mt-3 space-y-1">
                                  {customer.allergies && (
                                    <div className="text-sm">
                                      <span className="font-medium text-red-600">
                                        Allergieën:
                                      </span>
                                      <span className="ml-2">
                                        {customer.allergies}
                                      </span>
                                    </div>
                                  )}
                                  {customer.preferences && (
                                    <div className="text-sm">
                                      <span className="font-medium text-blue-600">
                                        Voorkeuren:
                                      </span>
                                      <span className="ml-2">
                                        {customer.preferences}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {customer.notes && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-medium">Notities:</span>
                                  <span className="ml-2">{customer.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCustomer(customer);
                                setEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Bewerken
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {displayCustomers.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Geen gasten gevonden
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm
                            ? "Probeer een andere zoekterm."
                            : "Voeg uw eerste gast toe om te beginnen."}
                        </p>
                        {!searchTerm && selectedRestaurant && (
                          <CreateCustomerModal
                            restaurantId={selectedRestaurant.id}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <div className="grid gap-4">
                  {recentCustomers.map((customer) => (
                    <Card key={customer.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getCustomerInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{customer.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Laatste bezoek:{" "}
                                {customer.last_visit &&
                                  formatLastVisit(customer.last_visit)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {customer.total_visits} bezoek(en)
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="frequent" className="space-y-4">
                <div className="grid gap-4">
                  {frequentCustomers.map((customer, index) => (
                    <Card key={customer.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {index + 1}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getCustomerInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{customer.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {customer.email || customer.phone}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default">
                            {customer.total_visits} bezoeken
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />
      )}
    </div>
  );
}

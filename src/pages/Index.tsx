import { Navigate, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Utensils,
  CreditCard,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useDate } from "@/components/layout/DateContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useActiveReservations } from "@/hooks/useReservations";
import { useRestaurantTables } from "@/hooks/useTables";
import { useWaitlist } from "@/hooks/useWaitlist";
import { useRealtimeSubscriptions } from "@/hooks/useRealtime";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentReservations } from "@/components/dashboard/RecentReservations";
import { FloorPlanPreview } from "@/components/dashboard/FloorPlanPreview";
import { CreateRestaurantModal } from "@/components/restaurant/CreateRestaurantModal";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurants = [], isLoading: restaurantsLoading } =
    useRestaurants();
  const { selectedDate, setSelectedDate } = useDate();

  // Ensure selectedDate is always a valid Date
  const safeSelectedDate = selectedDate || new Date();

  // For demo purposes, use the first restaurant or null
  const currentRestaurant = restaurants[0] || null;

  // Get active reservations for selected date (excludes cancelled)
  const { data: allReservations = [] } = useActiveReservations(
    currentRestaurant?.id
  );

  // Get tables and waitlist data
  const { data: tables = [] } = useRestaurantTables(currentRestaurant?.id);
  const { data: waitlistEntries = [] } = useWaitlist(currentRestaurant?.id);

  // Fix timezone issue by using local date formatting instead of ISO
  const year = safeSelectedDate.getFullYear();
  const month = String(safeSelectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeSelectedDate.getDate()).padStart(2, "0");
  const selectedDateString = `${year}-${month}-${day}`;

  const dayReservations = allReservations.filter(
    (r) => r.reservation_date === selectedDateString
  );

  // Set up realtime subscriptions
  useRealtimeSubscriptions(currentRestaurant?.id);

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (authLoading || restaurantsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No restaurant yet - show setup
  if (!currentRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="bg-gradient-hero p-6 rounded-xl text-primary-foreground shadow-elegant">
              <Utensils className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Welkom bij DineWise!</h1>
              <p className="text-primary-foreground/80">
                Laten we beginnen met het instellen van uw eerste restaurant
              </p>
            </div>

            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate("/create-restaurant")}
            >
              <Plus className="h-5 w-5" />
              Maak uw restaurant aan
            </Button>

            <p className="text-muted-foreground text-sm">
              Eenmaal aangemaakt heeft u toegang tot het volledige restaurant
              beheerdashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics from real data for selected date
  const confirmedReservations = dayReservations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const seatedGuests = dayReservations
    .filter((r) => r.status === "seated")
    .reduce((sum, r) => sum + r.party_size, 0);
  const totalRevenue = 2340; // This would come from payments data
  const pendingReservations = dayReservations.filter(
    (r) => r.status === "pending"
  ).length;

  // Calculate table statistics
  const availableTables = tables.filter((t) => t.status === "available").length;
  const totalTables = tables.length;
  const occupiedTables = tables.filter(
    (t) => t.status === "occupied" || t.status === "reserved"
  ).length;

  // Calculate waitlist for selected date
  const selectedDateWaitlist = waitlistEntries.filter((entry) => {
    const entryDateString = entry.preferred_date;
    return entryDateString === selectedDateString && entry.status === "waiting";
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-hero rounded-xl p-6 text-primary-foreground shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {safeSelectedDate.toDateString() === new Date().toDateString()
                    ? "Welkom terug!"
                    : `Dashboard voor ${safeSelectedDate.toLocaleDateString(
                        "nl-NL",
                        { weekday: "long", day: "numeric", month: "long" }
                      )}`}
                </h1>
                <p className="text-primary-foreground/80 text-lg">
                  Dit is wat er{" "}
                  {safeSelectedDate.toDateString() === new Date().toDateString()
                    ? "vandaag"
                    : "op deze dag"}{" "}
                  gebeurt bij {currentRestaurant.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {safeSelectedDate.toLocaleDateString("nl-NL", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year:
                      safeSelectedDate.getFullYear() !==
                      new Date().getFullYear()
                        ? "numeric"
                        : undefined,
                  })}
                </p>
                <p className="text-primary-foreground/80">Live Dashboard</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title={
                safeSelectedDate.toDateString() === new Date().toDateString()
                  ? "Reserveringen vandaag"
                  : `Reserveringen ${safeSelectedDate.toLocaleDateString(
                      "nl-NL",
                      { day: "numeric", month: "short" }
                    )}`
              }
              value={confirmedReservations.toString()}
              change={confirmedReservations > 0 ? "+12%" : "0%"}
              trend={confirmedReservations > 0 ? "up" : "neutral"}
              icon={Calendar}
              description="bevestigd"
            />
            <StatsCard
              title="Huidige gasten"
              value={seatedGuests.toString()}
              change={seatedGuests > 0 ? "+8%" : "0%"}
              trend={seatedGuests > 0 ? "up" : "neutral"}
              icon={Users}
              description="dineert nu"
            />
            <StatsCard
              title="Beschikbare tafels"
              value={availableTables.toString()}
              change={occupiedTables > 0 ? `-${occupiedTables}` : "0"}
              trend={occupiedTables > 0 ? "down" : "neutral"}
              icon={Utensils}
              description={`van ${totalTables} totaal`}
            />
            <StatsCard
              title="Omzet vandaag"
              value={`€${totalRevenue}`}
              change="+15%"
              trend="up"
              icon={CreditCard}
              description="vs gem. dagelijks"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Reservations */}
            <div className="lg:col-span-2">
              <RecentReservations
                reservations={dayReservations}
                selectedDate={safeSelectedDate}
              />
            </div>

            {/* Right Column - Floor Plan */}
            <div>
              <FloorPlanPreview
                restaurantId={currentRestaurant.id}
                selectedDate={safeSelectedDate}
              />
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Gemiddelde tafelomloop"
              value="87 min"
              change="-5 min"
              trend="up"
              icon={Clock}
              description="sneller dan gem."
            />
            <StatsCard
              title="Klanttevredenheid"
              value="4.8"
              change="+0.2"
              trend="up"
              icon={TrendingUp}
              description="van de 5.0 sterren"
            />
            <StatsCard
              title="Wachtende reserveringen"
              value={pendingReservations.toString()}
              change={pendingReservations > 0 ? "+1" : "0"}
              trend="neutral"
              icon={Users}
              description="wachten op bevestiging"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

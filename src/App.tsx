import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import { DateProvider } from "@/components/layout/DateContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Reservations from "./pages/Reservations";
import FloorPlan from "./pages/FloorPlan";
import Guests from "./pages/Guests";
import Waitlist from "./pages/Waitlist";
import Payments from "./pages/Payments";
import Reviews from "./pages/Reviews";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Agenda from "./pages/Agenda";
import CreateRestaurant from "./pages/CreateRestaurant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DateProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/floor-plan" element={<FloorPlan />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/create-restaurant" element={<CreateRestaurant />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DateProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

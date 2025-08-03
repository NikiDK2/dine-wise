import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OpeningHoursForm } from "@/components/settings/OpeningHoursForm";
import { CapacitySettingsForm } from "@/components/settings/CapacitySettingsForm";
import { RestaurantInfoCard } from "@/components/settings/RestaurantInfoCard";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Instellingen</h1>
                <p className="text-muted-foreground">Configureer uw restaurantinstellingen en voorkeuren.</p>
              </div>
            </div>
            
            <RestaurantInfoCard />
            <OpeningHoursForm />
            <CapacitySettingsForm />
          </div>
        </main>
      </div>
    </div>
  );
}
import { useRestaurants } from "@/hooks/useRestaurants";
import { useAuth } from "@/components/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Building2, Copy, Plus, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Restaurants() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurants = [], isLoading } = useRestaurants();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: "Restaurant ID gekopieerd naar klembord",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Mijn Restaurants</h1>
              <p className="text-muted-foreground">
                Beheer al uw restaurants en vind hun IDs
              </p>
            </div>
            <Button 
              onClick={() => navigate("/create-restaurant")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nieuw Restaurant
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Restaurants laden...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen restaurants gevonden</h3>
                <p className="text-muted-foreground mb-4">
                  U heeft nog geen restaurants aangemaakt.
                </p>
                <Button onClick={() => navigate("/create-restaurant")}>
                  Eerste Restaurant Aanmaken
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {restaurant.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {restaurant.description || "Geen beschrijving"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {restaurant.cuisine_type && (
                          <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(restaurant.id)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          ID Kopiëren
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{restaurant.address}</span>
                        </div>
                        {restaurant.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{restaurant.phone}</span>
                          </div>
                        )}
                        {restaurant.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{restaurant.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Restaurant ID:</span>
                          <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                            {restaurant.id}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Aangemaakt: {new Date(restaurant.created_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
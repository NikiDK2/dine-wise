import { useRestaurants } from "@/hooks/useRestaurants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building2, Copy, MapPin, Phone, Mail, Calendar, Hash, AlertCircle } from "lucide-react";

export function RestaurantInfoCard() {
  const { data: restaurants = [], isLoading, error } = useRestaurants();
  const { toast } = useToast();

  console.log("RestaurantInfoCard Debug:", { 
    isLoading, 
    error, 
    restaurantsCount: restaurants.length,
    restaurants: restaurants 
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: `${label} gekopieerd naar klembord`,
    });
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Fout bij laden restaurant informatie
          </CardTitle>
          <CardDescription>
            Er is een fout opgetreden bij het ophalen van de restaurant gegevens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Fout: {error.message || "Onbekende fout"}
          </p>
          <Button onClick={() => window.location.reload()}>
            Pagina herladen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Restaurant Informatie
          </CardTitle>
          <CardDescription>
            Informatie over uw restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (restaurants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Restaurant Informatie
          </CardTitle>
          <CardDescription>
            Geen restaurants gevonden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            U heeft nog geen restaurants aangemaakt. Ga naar de Create Restaurant pagina om er een aan te maken.
          </p>
          <Button onClick={() => window.location.href = '/create-restaurant'}>
            Restaurant Aanmaken
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Toon het eerste restaurant (meestal is er maar één)
  const restaurant = restaurants[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Restaurant Informatie
        </CardTitle>
        <CardDescription>
          Basis informatie en configuratie van uw restaurant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restaurant Naam en Type */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{restaurant.name}</h3>
            {restaurant.cuisine_type && (
              <Badge variant="secondary" className="mt-1">
                {restaurant.cuisine_type}
              </Badge>
            )}
          </div>
        </div>

        {/* Beschrijving */}
        {restaurant.description && (
          <div>
            <h4 className="font-medium mb-2">Beschrijving</h4>
            <p className="text-muted-foreground text-sm">
              {restaurant.description}
            </p>
          </div>
        )}

        {/* Contact Informatie */}
        <div className="space-y-3">
          <h4 className="font-medium">Contact Informatie</h4>
          <div className="space-y-2">
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
        </div>

        {/* Restaurant ID */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Restaurant ID
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-mono text-sm bg-muted p-3 rounded border break-all">
                {restaurant.id}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(restaurant.id, "Restaurant ID")}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Kopiëren
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Gebruik dit ID voor API calls en externe integraties
          </p>
        </div>

        {/* Aanmaak Datum */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Aangemaakt op {new Date(restaurant.created_at).toLocaleDateString('nl-NL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Laatste Update */}
        {restaurant.updated_at && restaurant.updated_at !== restaurant.created_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Laatst bijgewerkt op {new Date(restaurant.updated_at).toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
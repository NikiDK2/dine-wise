import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRestaurant } from "@/hooks/useRestaurants";
import { useAuth } from "@/components/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Settings,
  ArrowLeft,
  Save,
} from "lucide-react";

export default function CreateRestaurant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createRestaurant = useCreateRestaurant();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    cuisine_type: "",
    opening_hours: {
      monday: { open: "17:00", close: "22:00", closed: false },
      tuesday: { open: "17:00", close: "22:00", closed: false },
      wednesday: { open: "17:00", close: "22:00", closed: false },
      thursday: { open: "17:00", close: "22:00", closed: false },
      friday: { open: "17:00", close: "23:00", closed: false },
      saturday: { open: "17:00", close: "23:00", closed: false },
      sunday: { open: "17:00", close: "22:00", closed: false },
    },
    settings: {
      max_party_size: 20,
      min_party_size: 1,
      max_reservations_per_slot: 10,
      reservation_duration_minutes: 120,
      large_group_threshold: 6,
      auto_confirm_reservations: true,
      require_phone_number: false,
      require_email: true,
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpeningHoursChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day as keyof typeof prev.opening_hours],
          [field]: value,
        },
      },
    }));
  };

  const handleSettingsChange = (field: string, value: number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createRestaurant.mutateAsync({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        cuisine_type: formData.cuisine_type,
        opening_hours: formData.opening_hours,
        settings: formData.settings,
      });

      toast({
        title: "Restaurant aangemaakt!",
        description:
          "Uw restaurant is succesvol aangemaakt en klaar voor gebruik.",
      });

      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      toast({
        title: "Fout bij aanmaken",
        description:
          "Er is een fout opgetreden bij het aanmaken van het restaurant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
    "23:30",
  ];

  const days = [
    { key: "monday", label: "Maandag" },
    { key: "tuesday", label: "Dinsdag" },
    { key: "wednesday", label: "Woensdag" },
    { key: "thursday", label: "Donderdag" },
    { key: "friday", label: "Vrijdag" },
    { key: "saturday", label: "Zaterdag" },
    { key: "sunday", label: "Zondag" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nieuw Restaurant Aanmaken</h1>
              <p className="text-muted-foreground">
                Stel uw restaurantprofiel in om reserveringen en activiteiten te
                beheren
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Basis Info
                </TabsTrigger>
                <TabsTrigger value="hours" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Openingstijden
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Instellingen
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <ChefHat className="h-4 w-4" />
                  Voorvertoning
                </TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Basis Informatie
                    </CardTitle>
                    <CardDescription>
                      Vul de basisgegevens van uw restaurant in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Restaurant naam *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Le Petit Bistro"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Beschrijving</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Beschrijf uw restaurant, specialiteiten, sfeer..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cuisine_type">Keukentype</Label>
                      <Select
                        value={formData.cuisine_type}
                        onValueChange={(value) =>
                          handleInputChange("cuisine_type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer keukentype" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nederlands">Nederlands</SelectItem>
                          <SelectItem value="Frans">Frans</SelectItem>
                          <SelectItem value="Italiaans">Italiaans</SelectItem>
                          <SelectItem value="Spaans">Spaans</SelectItem>
                          <SelectItem value="Aziatisch">Aziatisch</SelectItem>
                          <SelectItem value="Mediterraans">
                            Mediterraans
                          </SelectItem>
                          <SelectItem value="Fusion">Fusion</SelectItem>
                          <SelectItem value="Anders">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="123 Restaurant Straat, 1234 AB Amsterdam"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefoon</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          placeholder="+31 6 1234 5678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          placeholder="info@restaurant.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Opening Hours */}
              <TabsContent value="hours" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Openingstijden
                    </CardTitle>
                    <CardDescription>
                      Stel de openingstijden van uw restaurant in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {days.map((day) => {
                      const dayData =
                        formData.opening_hours[
                          day.key as keyof typeof formData.opening_hours
                        ];
                      return (
                        <div
                          key={day.key}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="w-24">
                            <Label className="font-medium">{day.label}</Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!dayData.closed}
                              onCheckedChange={(checked) =>
                                handleOpeningHoursChange(
                                  day.key,
                                  "closed",
                                  !checked
                                )
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {dayData.closed ? "Gesloten" : "Open"}
                            </span>
                          </div>

                          {!dayData.closed && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={dayData.open}
                                onValueChange={(value) =>
                                  handleOpeningHoursChange(
                                    day.key,
                                    "open",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <span>tot</span>

                              <Select
                                value={dayData.close}
                                onValueChange={(value) =>
                                  handleOpeningHoursChange(
                                    day.key,
                                    "close",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Reserveringsinstellingen
                    </CardTitle>
                    <CardDescription>
                      Configureer hoe reserveringen worden afgehandeld
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="max_party_size">
                          Maximum groepsgrootte
                        </Label>
                        <Input
                          id="max_party_size"
                          type="number"
                          min="1"
                          max="50"
                          value={formData.settings.max_party_size}
                          onChange={(e) =>
                            handleSettingsChange(
                              "max_party_size",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="min_party_size">
                          Minimum groepsgrootte
                        </Label>
                        <Input
                          id="min_party_size"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.settings.min_party_size}
                          onChange={(e) =>
                            handleSettingsChange(
                              "min_party_size",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="large_group_threshold">
                          Grote groep drempel
                        </Label>
                        <Input
                          id="large_group_threshold"
                          type="number"
                          min="1"
                          max="20"
                          value={formData.settings.large_group_threshold}
                          onChange={(e) =>
                            handleSettingsChange(
                              "large_group_threshold",
                              parseInt(e.target.value)
                            )
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          Groepen groter dan dit aantal vereisen handmatige
                          goedkeuring
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation_duration">
                          Reserveringsduur (minuten)
                        </Label>
                        <Input
                          id="reservation_duration"
                          type="number"
                          min="30"
                          max="300"
                          step="30"
                          value={formData.settings.reservation_duration_minutes}
                          onChange={(e) =>
                            handleSettingsChange(
                              "reservation_duration_minutes",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Automatisch reserveringen bevestigen</Label>
                          <p className="text-sm text-muted-foreground">
                            Kleine groepen worden automatisch bevestigd
                          </p>
                        </div>
                        <Switch
                          checked={formData.settings.auto_confirm_reservations}
                          onCheckedChange={(checked) =>
                            handleSettingsChange(
                              "auto_confirm_reservations",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Telefoonnummer verplicht</Label>
                          <p className="text-sm text-muted-foreground">
                            Klanten moeten een telefoonnummer opgeven
                          </p>
                        </div>
                        <Switch
                          checked={formData.settings.require_phone_number}
                          onCheckedChange={(checked) =>
                            handleSettingsChange(
                              "require_phone_number",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email verplicht</Label>
                          <p className="text-sm text-muted-foreground">
                            Klanten moeten een email adres opgeven
                          </p>
                        </div>
                        <Switch
                          checked={formData.settings.require_email}
                          onCheckedChange={(checked) =>
                            handleSettingsChange("require_email", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Voorvertoning
                    </CardTitle>
                    <CardDescription>
                      Controleer uw restaurantgegevens voordat u opslaat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {formData.name || "Restaurant naam"}
                          </h3>
                          {formData.cuisine_type && (
                            <Badge variant="secondary">
                              {formData.cuisine_type}
                            </Badge>
                          )}
                        </div>

                        {formData.description && (
                          <p className="text-muted-foreground">
                            {formData.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {formData.address || "Adres niet ingevuld"}
                            </span>
                          </div>

                          {formData.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              <span>{formData.phone}</span>
                            </div>
                          )}

                          {formData.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <span>{formData.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Openingstijden</h4>
                        <div className="space-y-2">
                          {days.map((day) => {
                            const dayData =
                              formData.opening_hours[
                                day.key as keyof typeof formData.opening_hours
                              ];
                            return (
                              <div
                                key={day.key}
                                className="flex justify-between text-sm"
                              >
                                <span>{day.label}</span>
                                <span
                                  className={
                                    dayData.closed
                                      ? "text-red-500"
                                      : "text-green-600"
                                  }
                                >
                                  {dayData.closed
                                    ? "Gesloten"
                                    : `${dayData.open} - ${dayData.close}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Instellingen</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Max groepsgrootte:
                          </span>
                          <div className="font-medium">
                            {formData.settings.max_party_size}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Grote groep drempel:
                          </span>
                          <div className="font-medium">
                            {formData.settings.large_group_threshold}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Reserveringsduur:
                          </span>
                          <div className="font-medium">
                            {formData.settings.reservation_duration_minutes} min
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Auto bevestigen:
                          </span>
                          <div className="font-medium">
                            {formData.settings.auto_confirm_reservations
                              ? "Ja"
                              : "Nee"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name || !formData.address}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Aanmaken..." : "Restaurant Aanmaken"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

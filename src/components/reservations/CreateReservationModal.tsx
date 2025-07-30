import { useState } from "react";
import { useCreateReservation } from "@/hooks/useReservations";
import { useRestaurantTables } from "@/hooks/useTables";
import { useRestaurants } from "@/hooks/useRestaurants";
import { supabase } from "@/integrations/supabase/client";
import { CustomerSearch } from "@/components/ui/customer-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CalendarIcon } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  findBestTableAssignment,
  createTableCombinationNotification,
} from "@/utils/tableAssignment";
import {
  notifyLargePartyRequest,
  notifyCapacityExceeded,
} from "@/utils/adminNotifications";

interface CreateReservationModalProps {
  restaurantId: string;
}

export function CreateReservationModal({
  restaurantId,
}: CreateReservationModalProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    party_size: 2,
    reservation_time: "",
    table_id: undefined as string | undefined, // Changed from empty string to undefined
    notes: "",
    special_requests: "",
    status: "pending" as const,
  });

  const createReservation = useCreateReservation();
  const { toast } = useToast();
  const { data: tables = [] } = useRestaurantTables(restaurantId);
  const { data: restaurants = [] } = useRestaurants();

  const restaurant = restaurants.find((r) => r.id === restaurantId);
  const openingHours = restaurant?.opening_hours as any;

  const availableTables = tables.filter(
    (table) => table.status === "available"
  );

  // Check if a date is a closed day
  const isClosedDay = (date: Date) => {
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[date.getDay()];

    if (!openingHours || !openingHours[dayName]) {
      return false; // If no opening hours defined, assume open
    }

    return !openingHours[dayName].isOpen;
  };

  // Get available time slots based on opening hours and selected date
  const getAvailableTimeSlots = () => {
    if (!date || !openingHours) {
      return []; // No slots if no date selected or no opening hours
    }

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[date.getDay()];

    if (!openingHours[dayName] || !openingHours[dayName].isOpen) {
      return []; // No slots if closed
    }

    const daySchedule = openingHours[dayName];
    const timeSlots: string[] = [];

    if (daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
      daySchedule.timeSlots.forEach((slot: any) => {
        // Generate 30-minute intervals between open and close times
        const start = slot.openTime;
        const end = slot.closeTime;

        const [startHour, startMin] = start.split(":").map(Number);
        const [endHour, endMin] = end.split(":").map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (
          currentHour < endHour ||
          (currentHour === endHour && currentMin < endMin)
        ) {
          const timeString = `${currentHour
            .toString()
            .padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
          timeSlots.push(timeString);

          currentMin += 30;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour += 1;
          }
        }
      });
    }

    return timeSlots.sort();
  };

  const availableTimeSlots = getAvailableTimeSlots();

  const checkCapacityLimits = async () => {
    if (!restaurant || !date || !formData.reservation_time) {
      return { allowed: true, message: "" };
    }

    const capacitySettings = restaurant.settings?.timeBasedCapacities || [];
    const requestedTime = formData.reservation_time;

    // Find applicable capacity rule for this time
    const applicableRule = capacitySettings.find((rule: any) => {
      return requestedTime >= rule.startTime && requestedTime <= rule.endTime;
    });

    if (!applicableRule) {
      return { allowed: true, message: "" };
    }

    // Calculate time slot based on interval
    const interval = applicableRule.timeSlotInterval || 15;
    const timeSlotStart = calculateTimeSlotStart(requestedTime, interval);
    const timeSlotEnd = addMinutes(
      new Date(`2000-01-01T${timeSlotStart}:00`),
      interval
    );

    // Get existing reservations for this date and time slot
    const { data: existingReservations } = await supabase
      .from("reservations")
      .select("party_size")
      .eq("restaurant_id", restaurantId)
      .eq("reservation_date", format(date, "yyyy-MM-dd"))
      .gte("reservation_time", timeSlotStart)
      .lt("reservation_time", format(timeSlotEnd, "HH:mm"))
      .neq("status", "cancelled");

    const currentCapacity =
      existingReservations?.reduce((sum, res) => sum + res.party_size, 0) || 0;
    const newTotal = currentCapacity + formData.party_size;

    if (newTotal > applicableRule.maxGuestsPerSlot) {
      return {
        allowed: false,
        message: `Maximaal ${applicableRule.maxGuestsPerSlot} gasten per ${interval} minuten toegestaan. Huidige bezetting: ${currentCapacity}, gevraagd: ${formData.party_size}.`,
        currentCapacity,
        maxCapacity: applicableRule.maxGuestsPerSlot,
      };
    }

    return { allowed: true, message: "" };
  };

  const calculateTimeSlotStart = (time: string, interval: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const slotMinutes = Math.floor(totalMinutes / interval) * interval;
    const slotHours = Math.floor(slotMinutes / 60);
    const remainingMinutes = slotMinutes % 60;
    return `${slotHours.toString().padStart(2, "0")}:${remainingMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !formData.reservation_time) {
      return;
    }

    // Check capacity limits before creating reservation
    const capacityCheck = await checkCapacityLimits();
    if (!capacityCheck.allowed) {
      // Notify admin about capacity exceeded
      await notifyCapacityExceeded(
        restaurantId,
        formData.customer_name,
        formData.party_size,
        capacityCheck.currentCapacity || 0,
        capacityCheck.maxCapacity || 0,
        formData.reservation_time
      );

      toast({
        title: "Capaciteit Overschreden",
        description: capacityCheck.message + " Admin is geïnformeerd.",
        variant: "destructive",
      });
      return;
    }

    // Check if party size is more than 6
    if (formData.party_size > 6) {
      try {
        // Notify admin about large party request
        await notifyLargePartyRequest(
          restaurantId,
          formData.customer_name,
          formData.party_size,
          format(date, "yyyy-MM-dd"),
          formData.reservation_time
        );

        // Send email for large party instead of creating reservation
        const { error } = await supabase.functions.invoke(
          "send-large-party-email",
          {
            body: {
              customerName: formData.customer_name,
              customerEmail: formData.customer_email,
              customerPhone: formData.customer_phone,
              partySize: formData.party_size,
              preferredDate: format(date, "yyyy-MM-dd"),
              preferredTime: formData.reservation_time,
              specialRequests: formData.special_requests,
            },
          }
        );

        if (error) {
          throw error;
        }

        toast({
          title: "Aanvraag Verzonden",
          description: `Uw aanvraag voor ${formData.party_size} personen is verzonden. Admin is geïnformeerd en we nemen binnen 24 uur contact met u op.`,
        });

        setOpen(false);
        setDate(undefined);
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          party_size: 2,
          reservation_time: "",
          table_id: undefined, // Changed from empty string to undefined
          notes: "",
          special_requests: "",
          status: "pending",
        });
        return;
      } catch (error) {
        console.error("Error sending large party email:", error);
        toast({
          title: "Fout",
          description:
            "Er ging iets mis bij het verzenden van uw aanvraag. Probeer het opnieuw.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for automatic table assignment (only for 4 or fewer people)
    let tableAssignment = null;
    let finalTableId =
      formData.table_id === "none" ? null : formData.table_id || null;

    // Only attempt automatic assignment for parties of 4 or fewer
    if (formData.party_size <= 4) {
      tableAssignment = await findBestTableAssignment(
        restaurantId,
        formData.party_size,
        format(date, "yyyy-MM-dd"),
        formData.reservation_time
      );

      // If no table was manually selected and we have an automatic assignment
      if (!finalTableId && tableAssignment.assignment) {
        finalTableId = tableAssignment.assignment[0].id;
      }
    }

    // Normal reservation for 6 or fewer people
    const reservation = await createReservation.mutateAsync({
      ...formData,
      restaurant_id: restaurantId,
      reservation_date: format(date, "yyyy-MM-dd"),
      customer_id: null,
      table_id: finalTableId,
    });

    // Handle table combination notification for large parties or when combination is needed
    if (formData.party_size > 4) {
      // For large parties, always create a notification for manual assignment
      const largePartyCombinations = await findBestTableAssignment(
        restaurantId,
        formData.party_size,
        format(date, "yyyy-MM-dd"),
        formData.reservation_time
      );

      if (largePartyCombinations.availableCombinations.length > 0) {
        await createTableCombinationNotification(
          restaurantId,
          {
            id: reservation.id,
            customer_name: formData.customer_name,
            party_size: formData.party_size,
            reservation_date: format(date, "yyyy-MM-dd"),
            reservation_time: formData.reservation_time,
          },
          largePartyCombinations.availableCombinations
        );
      }

      toast({
        title: "Reservering Aangemaakt",
        description: `Reservering voor ${formData.party_size} personen aangemaakt. Tafel moet handmatig worden toegewezen.`,
      });
    } else if (
      tableAssignment &&
      !finalTableId &&
      tableAssignment.requiresCombination &&
      tableAssignment.availableCombinations.length > 0
    ) {
      await createTableCombinationNotification(
        restaurantId,
        {
          id: reservation.id,
          customer_name: formData.customer_name,
          party_size: formData.party_size,
          reservation_date: format(date, "yyyy-MM-dd"),
          reservation_time: formData.reservation_time,
        },
        tableAssignment.availableCombinations
      );

      toast({
        title: "Reservering Aangemaakt",
        description:
          "Reservering aangemaakt. Een melding is verzonden voor tafel combinatie.",
      });
    } else if (finalTableId) {
      toast({
        title: "Reservering Aangemaakt",
        description: `Reservering aangemaakt en tafel automatisch toegewezen.`,
      });
    } else {
      toast({
        title: "Reservering Aangemaakt",
        description:
          "Reservering aangemaakt. Tafel moet handmatig worden toegewezen.",
      });
    }

    setOpen(false);
    setDate(undefined);
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      party_size: 2,
      reservation_time: "",
      table_id: undefined, // Changed from empty string to undefined
      notes: "",
      special_requests: "",
      status: "pending",
    });
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: customer.name,
      customer_email: customer.email || "",
      customer_phone: customer.phone || "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Reservering
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe Reservering</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe reservering toe aan uw restaurant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Search */}
          <CustomerSearch
            restaurantId={restaurantId}
            onCustomerSelect={handleCustomerSelect}
            placeholder="Type om klanten te zoeken..."
            label="Bestaande Klant (optioneel)"
          />

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Naam *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_size">Aantal Personen *</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                value={formData.party_size}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    party_size: parseInt(e.target.value) || 1,
                  }))
                }
                required
              />
              {formData.party_size > 6 && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                  ⚠️ Voor groepen van meer dan 6 personen sturen wij uw aanvraag
                  door naar het restaurant. U ontvangt binnen 24 uur een
                  bevestiging.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_email">E-mail</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefoon</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_phone: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "PPP", { locale: nl })
                      : "Selecteer datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      // Clear time selection when date changes
                      setFormData((prev) => ({
                        ...prev,
                        reservation_time: "",
                      }));
                    }}
                    disabled={(date) => date < new Date() || isClosedDay(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tijd *</Label>
              {availableTimeSlots.length > 0 ? (
                <Select
                  value={formData.reservation_time}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      reservation_time: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer tijd" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full p-3 text-sm text-muted-foreground bg-muted/50 border border-border rounded-md">
                  {!date
                    ? "Selecteer eerst een datum"
                    : "Restaurant is gesloten op deze dag"}
                </div>
              )}
            </div>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Tafel (optioneel)</Label>
            <Select
              value={formData.table_id || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  table_id: value || undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een tafel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen specifieke tafel</SelectItem>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.table_number} (capaciteit: {table.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">In Afwachting</SelectItem>
                <SelectItem value="confirmed">Bevestigd</SelectItem>
                <SelectItem value="seated">Gearriveerd</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
                <SelectItem value="no_show">Niet Verschenen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="special_requests">Speciale Verzoeken</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  special_requests: e.target.value,
                }))
              }
              placeholder="Bijv. vegetarisch menu, kinderstoel, etc..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Interne Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Interne notities voor het personeel..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={createReservation.isPending}>
              {formData.party_size > 6
                ? createReservation.isPending
                  ? "Aanvraag Verzenden..."
                  : "Aanvraag Verzenden"
                : createReservation.isPending
                ? "Toevoegen..."
                : "Reservering Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

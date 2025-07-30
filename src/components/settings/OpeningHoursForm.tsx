import { useState, useEffect } from 'react';
import { useRestaurants, useUpdateRestaurant } from '@/hooks/useRestaurants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, Save, Plus, Trash2 } from 'lucide-react';

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DayHours {
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const DAYS = [
  { key: 'monday', label: 'Maandag' },
  { key: 'tuesday', label: 'Dinsdag' },
  { key: 'wednesday', label: 'Woensdag' },
  { key: 'thursday', label: 'Donderdag' },
  { key: 'friday', label: 'Vrijdag' },
  { key: 'saturday', label: 'Zaterdag' },
  { key: 'sunday', label: 'Zondag' },
] as const;

const DEFAULT_TIME_SLOT: TimeSlot = {
  openTime: '12:00',
  closeTime: '22:00',
};

const DEFAULT_HOURS: DayHours = {
  isOpen: true,
  timeSlots: [DEFAULT_TIME_SLOT],
};

export function OpeningHoursForm() {
  const { data: restaurants = [] } = useRestaurants();
  const updateRestaurant = useUpdateRestaurant();
  const restaurant = restaurants[0]; // Assuming single restaurant for now

  const [hours, setHours] = useState<OpeningHours>({
    monday: DEFAULT_HOURS,
    tuesday: DEFAULT_HOURS,
    wednesday: DEFAULT_HOURS,
    thursday: DEFAULT_HOURS,
    friday: DEFAULT_HOURS,
    saturday: DEFAULT_HOURS,
    sunday: DEFAULT_HOURS,
  });

  // Load existing opening hours
  useEffect(() => {
    if (restaurant?.opening_hours) {
      const existingHours = restaurant.opening_hours as any;
      const loadedHours: OpeningHours = {} as OpeningHours;
      
      DAYS.forEach(({ key }) => {
        const existingDay = existingHours[key];
        if (existingDay) {
          // Handle old format (single time slot) and new format (multiple time slots)
          if (existingDay.openTime && existingDay.closeTime) {
            // Old format - convert to new format
            loadedHours[key as keyof OpeningHours] = {
              isOpen: existingDay.isOpen || true,
              timeSlots: [{
                openTime: existingDay.openTime,
                closeTime: existingDay.closeTime,
              }],
            };
          } else if (existingDay.timeSlots) {
            // New format
            loadedHours[key as keyof OpeningHours] = existingDay;
          } else {
            loadedHours[key as keyof OpeningHours] = DEFAULT_HOURS;
          }
        } else {
          loadedHours[key as keyof OpeningHours] = DEFAULT_HOURS;
        }
      });
      
      setHours(loadedHours);
    }
  }, [restaurant]);

  const handleDayToggle = (day: keyof OpeningHours, isOpen: boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen,
      },
    }));
  };

  const handleTimeSlotChange = (day: keyof OpeningHours, slotIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addTimeSlot = (day: keyof OpeningHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { ...DEFAULT_TIME_SLOT }],
      },
    }));
  };

  const removeTimeSlot = (day: keyof OpeningHours, slotIndex: number) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, index) => index !== slotIndex),
      },
    }));
  };

  const handleSave = async () => {
    if (!restaurant) return;

    await updateRestaurant.mutateAsync({
      id: restaurant.id,
      updates: {
        opening_hours: hours,
      },
    });
  };

  const copyToAllDays = (sourceDay: keyof OpeningHours) => {
    const sourceHours = hours[sourceDay];
    const newHours: OpeningHours = {} as OpeningHours;
    
    DAYS.forEach(({ key }) => {
      newHours[key as keyof OpeningHours] = { 
        isOpen: sourceHours.isOpen,
        timeSlots: sourceHours.timeSlots.map(slot => ({ ...slot }))
      };
    });
    
    setHours(newHours);
  };

  if (!restaurant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Geen restaurant gevonden. Maak eerst een restaurant aan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Openingstijden
        </CardTitle>
        <CardDescription>
          Stel de openingstijden van uw restaurant in voor elke dag van de week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {DAYS.map(({ key, label }) => (
          <div key={key} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{label}</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToAllDays(key as keyof OpeningHours)}
                  className="text-xs"
                >
                  Kopieer naar alle dagen
                </Button>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${key}-toggle`} className="text-sm">
                    {hours[key as keyof OpeningHours].isOpen ? 'Open' : 'Gesloten'}
                  </Label>
                  <Switch
                    id={`${key}-toggle`}
                    checked={hours[key as keyof OpeningHours].isOpen}
                    onCheckedChange={(checked) => handleDayToggle(key as keyof OpeningHours, checked)}
                  />
                </div>
              </div>
            </div>
            
            {hours[key as keyof OpeningHours].isOpen && (
              <div className="space-y-3 ml-4">
                {hours[key as keyof OpeningHours].timeSlots.map((timeSlot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-12">Van:</Label>
                      <Input
                        type="time"
                        value={timeSlot.openTime}
                        onChange={(e) => handleTimeSlotChange(key as keyof OpeningHours, slotIndex, 'openTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-12">Tot:</Label>
                      <Input
                        type="time"
                        value={timeSlot.closeTime}
                        onChange={(e) => handleTimeSlotChange(key as keyof OpeningHours, slotIndex, 'closeTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    {hours[key as keyof OpeningHours].timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTimeSlot(key as keyof OpeningHours, slotIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(key as keyof OpeningHours)}
                  className="ml-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tijdslot Toevoegen
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={updateRestaurant.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateRestaurant.isPending ? 'Opslaan...' : 'Openingstijden Opslaan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
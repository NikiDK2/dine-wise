import { useState, useEffect } from 'react';
import { useRestaurants, useUpdateRestaurant } from '@/hooks/useRestaurants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Save, Plus, Trash2 } from 'lucide-react';

interface TimeBasedCapacity {
  id: string;
  startTime: string;
  endTime: string;
  maxGuestsPerSlot: number;
  timeSlotInterval: number;
  name: string;
}

interface CapacitySettings {
  timeBasedCapacities: TimeBasedCapacity[];
  maxAdvanceBookingDays: number;
}

const TIME_SLOT_OPTIONS = [
  { value: 15, label: '15 minuten' },
  { value: 30, label: '30 minuten' },
  { value: 45, label: '45 minuten' },
  { value: 60, label: '1 uur' },
];

const DEFAULT_CAPACITY_SETTINGS: CapacitySettings = {
  timeBasedCapacities: [
    {
      id: '1',
      name: 'Ochtend',
      startTime: '08:30',
      endTime: '10:30',
      maxGuestsPerSlot: 12,
      timeSlotInterval: 15,
    },
    {
      id: '2',
      name: 'Lunch',
      startTime: '11:30',
      endTime: '13:30',
      maxGuestsPerSlot: 10,
      timeSlotInterval: 15,
    },
    {
      id: '3',
      name: 'Avond',
      startTime: '18:00',
      endTime: '23:00',
      maxGuestsPerSlot: 12,
      timeSlotInterval: 15,
    },
  ],
  maxAdvanceBookingDays: 30,
};

export function CapacitySettingsForm() {
  const { data: restaurants = [] } = useRestaurants();
  const updateRestaurant = useUpdateRestaurant();
  const restaurant = restaurants[0]; // Assuming single restaurant for now

  const [settings, setSettings] = useState<CapacitySettings>(DEFAULT_CAPACITY_SETTINGS);

  // Load existing capacity settings
  useEffect(() => {
    if (restaurant?.settings) {
      const existingSettings = restaurant.settings as any;
      setSettings({
        timeBasedCapacities: existingSettings.timeBasedCapacities || DEFAULT_CAPACITY_SETTINGS.timeBasedCapacities,
        maxAdvanceBookingDays: existingSettings.maxAdvanceBookingDays || DEFAULT_CAPACITY_SETTINGS.maxAdvanceBookingDays,
      });
    }
  }, [restaurant]);

  const addTimeBasedCapacity = () => {
    const newCapacity: TimeBasedCapacity = {
      id: Date.now().toString(),
      name: 'Nieuwe periode',
      startTime: '12:00',
      endTime: '14:00',
      maxGuestsPerSlot: 12,
      timeSlotInterval: 15,
    };
    
    setSettings(prev => ({
      ...prev,
      timeBasedCapacities: [...prev.timeBasedCapacities, newCapacity],
    }));
  };

  const removeTimeBasedCapacity = (id: string) => {
    setSettings(prev => ({
      ...prev,
      timeBasedCapacities: prev.timeBasedCapacities.filter(capacity => capacity.id !== id),
    }));
  };

  const updateTimeBasedCapacity = (id: string, updates: Partial<TimeBasedCapacity>) => {
    setSettings(prev => ({
      ...prev,
      timeBasedCapacities: prev.timeBasedCapacities.map(capacity =>
        capacity.id === id ? { ...capacity, ...updates } : capacity
      ),
    }));
  };

  const handleSave = async () => {
    if (!restaurant) return;

    const updatedSettings = {
      ...restaurant.settings,
      ...settings,
    };

    await updateRestaurant.mutateAsync({
      id: restaurant.id,
      updates: {
        settings: updatedSettings,
      },
    });
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
          <Users className="h-5 w-5" />
          Capaciteitsinstellingen
        </CardTitle>
        <CardDescription>
          Stel verschillende capaciteiten in voor verschillende tijdsperiodes van de dag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time-based capacities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Tijdsperiode Capaciteiten</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addTimeBasedCapacity}
            >
              <Plus className="h-4 w-4 mr-2" />
              Periode Toevoegen
            </Button>
          </div>

          {settings.timeBasedCapacities.map((capacity) => (
            <Card key={capacity.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Naam</Label>
                  <Input
                    value={capacity.name}
                    onChange={(e) => updateTimeBasedCapacity(capacity.id, { name: e.target.value })}
                    placeholder="Bijvoorbeeld: Lunch"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Starttijd</Label>
                  <Input
                    type="time"
                    value={capacity.startTime}
                    onChange={(e) => updateTimeBasedCapacity(capacity.id, { startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eindtijd</Label>
                  <Input
                    type="time"
                    value={capacity.endTime}
                    onChange={(e) => updateTimeBasedCapacity(capacity.id, { endTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max personen per slot</Label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={capacity.maxGuestsPerSlot}
                    onChange={(e) => updateTimeBasedCapacity(capacity.id, { 
                      maxGuestsPerSlot: parseInt(e.target.value) || 1 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tijdsslot interval</Label>
                  <Select
                    value={capacity.timeSlotInterval.toString()}
                    onValueChange={(value) => updateTimeBasedCapacity(capacity.id, { 
                      timeSlotInterval: parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTimeBasedCapacity(capacity.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* General settings */}
        <div className="space-y-2">
          <Label htmlFor="maxAdvanceBookingDays">
            Maximaal aantal dagen vooruit boeken
          </Label>
          <Input
            id="maxAdvanceBookingDays"
            type="number"
            min="1"
            max="365"
            value={settings.maxAdvanceBookingDays}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              maxAdvanceBookingDays: parseInt(e.target.value) || 1
            }))}
            className="w-full md:w-48"
          />
          <p className="text-xs text-muted-foreground">
            Hoeveel dagen van tevoren kunnen gasten reserveren
          </p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Huidige instellingen samenvatting:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {settings.timeBasedCapacities.map((capacity) => (
              <li key={capacity.id}>
                • {capacity.name}: {capacity.maxGuestsPerSlot} personen per {capacity.timeSlotInterval} min 
                ({capacity.startTime} - {capacity.endTime})
              </li>
            ))}
            <li>• Reserveringen mogelijk tot {settings.maxAdvanceBookingDays} dagen vooruit</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={updateRestaurant.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateRestaurant.isPending ? 'Opslaan...' : 'Capaciteitsinstellingen Opslaan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
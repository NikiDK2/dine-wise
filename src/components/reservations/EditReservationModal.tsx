import { useState } from 'react';
import { useUpdateReservation } from '@/hooks/useReservations';
import { useCustomers } from '@/hooks/useCustomers';
import { useRestaurantTables } from '@/hooks/useTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Reservation } from '@/hooks/useReservations';

interface EditReservationModalProps {
  reservation: Reservation;
  restaurantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditReservationModal({ reservation, restaurantId, open, onOpenChange }: EditReservationModalProps) {
  const [date, setDate] = useState<Date>(new Date(reservation.reservation_date));
  const [formData, setFormData] = useState({
    customer_name: reservation.customer_name,
    customer_email: reservation.customer_email || '',
    customer_phone: reservation.customer_phone || '',
    party_size: reservation.party_size,
    reservation_time: reservation.reservation_time,
    table_id: reservation.table_id || undefined, // Changed to undefined instead of empty string
    notes: reservation.notes || '',
    special_requests: reservation.special_requests || '',
    status: reservation.status,
  });
  
  const updateReservation = useUpdateReservation();
  const { data: customers = [] } = useCustomers(restaurantId);
  const { data: tables = [] } = useRestaurantTables(restaurantId);

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateReservation.mutateAsync({
      id: reservation.id,
      updates: {
        ...formData,
        table_id: formData.table_id === 'none' ? null : formData.table_id || null,
        reservation_date: format(date, 'yyyy-MM-dd'),
      }
    });
    
    onOpenChange(false);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_name: customer.name,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservering Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de details van deze reservering.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Existing Customer Selection */}
          <div className="space-y-2">
            <Label>Bestaande Klant (optioneel)</Label>
            <Select onValueChange={handleCustomerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een bestaande klant..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.email && `(${customer.email})`}
                  </SelectItem>
                ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Naam *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, party_size: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_email">E-mail</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefoon</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
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
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP", { locale: nl })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Tijd *</Label>
              <Select
                value={formData.reservation_time}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reservation_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Tafel</Label>
            <Select
              value={formData.table_id || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, table_id: value || null }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een tafel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen tafel toegewezen</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.table_number} (capaciteit: {table.capacity})
                  </SelectItem>
                ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
              placeholder="Bijv. vegetarisch menu, kinderstoel, etc..."
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Interne Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Interne notities voor het personeel..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={updateReservation.isPending}>
              {updateReservation.isPending ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

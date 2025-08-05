import { useState } from 'react';
import { useUpdateCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { Customer } from '@/hooks/useCustomers';

interface EditCustomerModalProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerModal({ customer, open, onOpenChange }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: customer.name,
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    notes: customer.notes || '',
    allergies: customer.allergies || '',
    preferences: customer.preferences || '',
    address: customer.address || '',
    city: customer.city || '',
    zip: customer.zip || '',
    country: customer.country || '',
    company: customer.company || '',
    language: customer.language || '',
  });
  
  const updateCustomer = useUpdateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zorg ervoor dat de volledige naam correct wordt samengesteld
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    
    await updateCustomer.mutateAsync({
      id: customer.id,
      updates: {
        ...formData,
        name: fullName,
      },
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Klant Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de gegevens van {customer.name}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Voornaam *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  first_name: e.target.value,
                  name: `${e.target.value} ${prev.last_name}`.trim()
                }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Achternaam *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  last_name: e.target.value,
                  name: `${prev.first_name} ${e.target.value}`.trim()
                }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Bedrijf</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip">Postcode</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                placeholder="nl, en, fr, de"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergieën</Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="Gluten, lactose, noten..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Voorkeuren</Label>
            <Textarea
              id="preferences"
              value={formData.preferences}
              onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
              placeholder="Speciale voorkeuren, favoriete gerechten..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Extra informatie over de klant..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCustomer.isPending}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={updateCustomer.isPending}
            >
              <Edit className="h-4 w-4 mr-2" />
              {updateCustomer.isPending ? "Bijwerken..." : "Bijwerken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
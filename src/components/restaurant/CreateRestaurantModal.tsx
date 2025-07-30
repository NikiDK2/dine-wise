import { useState } from 'react';
import { useCreateRestaurant } from '@/hooks/useRestaurants';
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
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateRestaurantModalProps {
  children: React.ReactNode;
}

export function CreateRestaurantModal({ children }: CreateRestaurantModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const createRestaurant = useCreateRestaurant();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const restaurantData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      cuisine_type: formData.get('cuisine_type') as string,
    };

    try {
      await createRestaurant.mutateAsync(restaurantData);
      setOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restaurant aanmaken</DialogTitle>
          <DialogDescription>
            Stel uw restaurantprofiel in om reserveringen en activiteiten te beheren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant naam</Label>
            <Input
              id="name"
              name="name"
              placeholder="Le Petit Bistro"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cuisine_type">Keukentype</Label>
            <Input
              id="cuisine_type"
              name="cuisine_type"
              placeholder="Frans, Italiaans, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Restaurant Straat, Stad"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+31 6 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="info@restaurant.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Korte beschrijving van uw restaurant..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Aanmaken..." : "Restaurant aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
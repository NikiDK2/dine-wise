import { useState } from 'react';
import { useCreateTable } from '@/hooks/useTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CreateTableModalProps {
  restaurantId: string;
}

export function CreateTableModal({ restaurantId }: CreateTableModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 2,
    status: 'available' as const,
    position_x: 0,
    position_y: 0,
  });
  
  const createTable = useCreateTable();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTable.mutateAsync({
      ...formData,
      restaurant_id: restaurantId,
      is_active: true,
    });
    
    setOpen(false);
    setFormData({
      table_number: '',
      capacity: 2,
      status: 'available',
      position_x: 0,
      position_y: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Tafel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nieuwe Tafel Toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe tafel toe aan uw restaurant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table_number">Tafelnummer *</Label>
            <Input
              id="table_number"
              value={formData.table_number}
              onChange={(e) => setFormData(prev => ({ ...prev, table_number: e.target.value }))}
              placeholder="bijv. T1, A4, Terras 3"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capaciteit *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Beschikbaar</SelectItem>
                <SelectItem value="occupied">Bezet</SelectItem>
                <SelectItem value="reserved">Gereserveerd</SelectItem>
                <SelectItem value="cleaning">Schoonmaken</SelectItem>
                <SelectItem value="out_of_order">Buiten Dienst</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position_x">X Positie</Label>
              <Input
                id="position_x"
                type="number"
                value={formData.position_x}
                onChange={(e) => setFormData(prev => ({ ...prev, position_x: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position_y">Y Positie</Label>
              <Input
                id="position_y"
                type="number"
                value={formData.position_y}
                onChange={(e) => setFormData(prev => ({ ...prev, position_y: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={createTable.isPending}>
              {createTable.isPending ? 'Toevoegen...' : 'Tafel Toevoegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
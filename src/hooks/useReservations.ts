import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Reservation {
  id: string;
  restaurant_id: string;
  table_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  special_requests?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  restaurant_tables?: {
    table_number: string;
  };
}

export function useReservations(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reservations', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          restaurant_tables (table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false });
      
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user && !!restaurantId,
  });
}

// Hook for active reservations (excludes cancelled)
export function useActiveReservations(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['active_reservations', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          restaurant_tables (table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .neq('status', 'cancelled') // Exclude cancelled reservations
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false });
      
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function useTodayReservations(restaurantId?: string) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['reservations', 'today', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          restaurant_tables (table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', today)
        .neq('status', 'cancelled') // Exclude cancelled reservations
        .order('reservation_time', { ascending: true });
      
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'restaurant_tables'>) => {
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          ...reservation,
          created_by: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reservation Created",
        description: "The reservation has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reservation> }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reservation Updated",
        description: "The reservation has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
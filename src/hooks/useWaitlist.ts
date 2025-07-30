import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WaitlistEntry {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  party_size: number;
  preferred_date: string;
  preferred_time: string;
  notes?: string;
  status: 'waiting' | 'contacted' | 'confirmed' | 'expired';
  created_at: string;
  updated_at: string;
}

export function useWaitlist(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['waitlist', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as WaitlistEntry[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function useCreateWaitlistEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('waitlist')
        .insert([entry])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: "Toegevoegd aan wachtlijst",
        description: "De klant is succesvol toegevoegd aan de wachtlijst.",
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

export function useUpdateWaitlistEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WaitlistEntry> }) => {
      const { data, error } = await supabase
        .from('waitlist')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: "Wachtlijst bijgewerkt",
        description: "De wachtlijst entry is succesvol bijgewerkt.",
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

export function useDeleteWaitlistEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: "Verwijderd van wachtlijst",
        description: "De klant is verwijderd van de wachtlijst.",
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
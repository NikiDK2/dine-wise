import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  cuisine_type?: string;
  opening_hours?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export function useRestaurants() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['restaurants', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      
      console.log("useRestaurants Debug - User ID:", user.id);
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log("useRestaurants Debug - Query result:", { data, error });
      
      if (error) throw error;
      return data as Restaurant[];
    },
    enabled: !!user,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('restaurants')
        .insert([{
          ...restaurant,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({
        title: "Restaurant Created",
        description: "Your restaurant has been successfully created.",
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

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Restaurant> }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({
        title: "Restaurant Bijgewerkt",
        description: "Uw restaurant instellingen zijn succesvol bijgewerkt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  email?: string;
  phone?: string;
  professional_email?: string;
  professional_phone?: string;
  notes?: string;
  allergies?: string;
  allergies_tags?: string[];
  preferences?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  birthdate?: string;
  company?: string;
  language?: string;
  guest_status?: string;
  email_optin_marketing?: boolean;
  email_optin_registration_date?: string;
  sms_optin_marketing?: boolean;
  sms_optin_registration_date?: string;
  email_optin_reviews?: boolean;
  email_optin_reviews_registration_date?: string;
  sms_optin_reviews?: boolean;
  sms_optin_reviews_registration_date?: string;
  has_no_show?: boolean;
  is_blacklisted?: boolean;
  bookings_number?: number;
  total_visits: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

export function useCustomers(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function useSearchCustomers(restaurantId?: string, searchTerm?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers-search', restaurantId, searchTerm, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId || !searchTerm || searchTerm.length < 2) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user && !!restaurantId && !!searchTerm && searchTerm.length >= 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'last_visit'>) => {
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Klant Toegevoegd",
        description: "De klant is succesvol toegevoegd aan uw database.",
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

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Klant Bijgewerkt",
        description: "De klantgegevens zijn succesvol bijgewerkt.",
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

export function useDeleteAllCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (restaurantId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('restaurant_id', restaurantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Alle Klanten Verwijderd",
        description: "Alle klantgegevens zijn succesvol verwijderd.",
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
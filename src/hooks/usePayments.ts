import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  restaurant_id: string;
  reservation_id?: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  created_at: string;
}

export function usePayments(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          reservations:reservation_id (
            customer_name,
            reservation_date,
            reservation_time
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function usePaymentStats(restaurantId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payment_stats', restaurantId, user?.id],
    queryFn: async () => {
      if (!user || !restaurantId) throw new Error('Missing required parameters');
      
      const { data, error } = await supabase
        .from('payments')
        .select('amount_cents, status, created_at')
        .eq('restaurant_id', restaurantId);
      
      if (error) throw error;
      
      const totalRevenue = data
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount_cents, 0);
      
      const todayRevenue = data
        .filter(p => 
          p.status === 'completed' && 
          new Date(p.created_at).toDateString() === new Date().toDateString()
        )
        .reduce((sum, p) => sum + p.amount_cents, 0);
      
      const thisMonthRevenue = data
        .filter(p => {
          const paymentDate = new Date(p.created_at);
          const now = new Date();
          return p.status === 'completed' && 
                 paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount_cents, 0);
      
      return {
        totalRevenue,
        todayRevenue,
        thisMonthRevenue,
        totalTransactions: data.length,
        completedTransactions: data.filter(p => p.status === 'completed').length,
      };
    },
    enabled: !!user && !!restaurantId,
  });
}
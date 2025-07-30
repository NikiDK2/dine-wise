import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

export function useRealtimeSubscriptions(restaurantId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !restaurantId) return;

    // Subscribe to reservations changes
    const reservationsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Reservation change:', payload);
          // Invalidate reservations queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Table change:', payload);
          // Invalidate tables queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Payment change:', payload);
          // Invalidate payments queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
    };
  }, [user, restaurantId, queryClient]);
}
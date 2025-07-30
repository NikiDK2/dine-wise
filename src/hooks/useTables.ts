import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  position_x?: number;
  position_y?: number;
  status: "available" | "occupied" | "reserved" | "cleaning" | "out_of_order";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRestaurantTables(restaurantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant_tables", restaurantId, user?.id],
    queryFn: async () => {
      console.log("=== useRestaurantTables DEBUG ===");
      console.log("Restaurant ID:", restaurantId);
      console.log("User ID:", user?.id);

      if (!user || !restaurantId)
        throw new Error("Missing required parameters");

      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("table_number", { ascending: true });

      if (error) {
        console.error("Error fetching tables:", error);
        throw error;
      }

      console.log(
        "Fetched tables:",
        data?.map((t) => ({
          id: t.id,
          table_number: t.table_number,
          capacity: t.capacity,
          status: t.status,
          position_x: t.position_x,
          position_y: t.position_y,
        }))
      );

      // Debug: Check if any tables have reserved status
      const reservedTables = data?.filter((t) => t.status === "reserved") || [];
      console.log("Tables with reserved status:", reservedTables.length);
      if (reservedTables.length > 0) {
        console.log(
          "Reserved tables details:",
          reservedTables.map((t) => ({
            id: t.id,
            table_number: t.table_number,
            status: t.status,
          }))
        );
      }

      console.log("=== useRestaurantTables DEBUG END ===");
      return data as RestaurantTable[];
    },
    enabled: !!user && !!restaurantId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      table: Omit<RestaurantTable, "id" | "created_at" | "updated_at">
    ) => {
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert([table])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant_tables"] });
      toast({
        title: "Tafel Toegevoegd",
        description: "De tafel is succesvol toegevoegd.",
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

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<RestaurantTable>;
    }) => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log("=== useUpdateTable SUCCESS ===");
      console.log("Invalidating restaurant_tables queries...");
      queryClient.invalidateQueries({ queryKey: ["restaurant_tables"] });
      console.log("Queries invalidated");
      toast({
        title: "Tafel Bijgewerkt",
        description: "De tafelgegevens zijn succesvol bijgewerkt.",
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

// Hook for real-time table updates
export function useTableStatusSubscription(restaurantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    // Subscribe to reservation changes that affect table status
    const reservationChannel = supabase
      .channel("reservation-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["restaurant_tables", restaurantId],
          });
        }
      )
      .subscribe();

    // Subscribe to direct table changes
    const tableChannel = supabase
      .channel("table-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["restaurant_tables", restaurantId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(tableChannel);
    };
  }, [restaurantId, queryClient]);
}

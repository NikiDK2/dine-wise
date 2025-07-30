export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)";
  };
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null;
          allergies: string | null;
          allergies_tags: string[] | null;
          birthdate: string | null;
          bookings_number: number | null;
          city: string | null;
          company: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          email_optin_marketing: boolean | null;
          email_optin_registration_date: string | null;
          email_optin_reviews: boolean | null;
          email_optin_reviews_registration_date: string | null;
          first_name: string | null;
          guest_status: string | null;
          has_no_show: boolean | null;
          id: string;
          is_blacklisted: boolean | null;
          language: string | null;
          last_name: string | null;
          last_visit: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          preferences: string | null;
          professional_email: string | null;
          professional_phone: string | null;
          restaurant_id: string;
          sms_optin_marketing: boolean | null;
          sms_optin_registration_date: string | null;
          sms_optin_reviews: boolean | null;
          sms_optin_reviews_registration_date: string | null;
          total_visits: number | null;
          updated_at: string;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          allergies?: string | null;
          allergies_tags?: string[] | null;
          birthdate?: string | null;
          bookings_number?: number | null;
          city?: string | null;
          company?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          email_optin_marketing?: boolean | null;
          email_optin_registration_date?: string | null;
          email_optin_reviews?: boolean | null;
          email_optin_reviews_registration_date?: string | null;
          first_name?: string | null;
          guest_status?: string | null;
          has_no_show?: boolean | null;
          id?: string;
          is_blacklisted?: boolean | null;
          language?: string | null;
          last_name?: string | null;
          last_visit?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          preferences?: string | null;
          professional_email?: string | null;
          professional_phone?: string | null;
          restaurant_id: string;
          sms_optin_marketing?: boolean | null;
          sms_optin_registration_date?: string | null;
          sms_optin_reviews?: boolean | null;
          sms_optin_reviews_registration_date?: string | null;
          total_visits?: number | null;
          updated_at?: string;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          allergies?: string | null;
          allergies_tags?: string[] | null;
          birthdate?: string | null;
          bookings_number?: number | null;
          city?: string | null;
          company?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          email_optin_marketing?: boolean | null;
          email_optin_registration_date?: string | null;
          email_optin_reviews?: boolean | null;
          email_optin_reviews_registration_date?: string | null;
          first_name?: string | null;
          guest_status?: string | null;
          has_no_show?: boolean | null;
          id?: string;
          is_blacklisted?: boolean | null;
          language?: string | null;
          last_name?: string | null;
          last_visit?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          preferences?: string | null;
          professional_email?: string | null;
          professional_phone?: string | null;
          restaurant_id?: string;
          sms_optin_marketing?: boolean | null;
          sms_optin_registration_date?: string | null;
          sms_optin_reviews?: boolean | null;
          sms_optin_reviews_registration_date?: string | null;
          total_visits?: number | null;
          updated_at?: string;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          is_read: boolean | null;
          message: string;
          restaurant_id: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          restaurant_id: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          restaurant_id?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string | null;
          id: string;
          paid_at: string | null;
          payment_method: string | null;
          reservation_id: string | null;
          restaurant_id: string;
          status: Database["public"]["Enums"]["payment_status"] | null;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string | null;
          id?: string;
          paid_at?: string | null;
          payment_method?: string | null;
          reservation_id?: string | null;
          restaurant_id: string;
          status?: Database["public"]["Enums"]["payment_status"] | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string | null;
          id?: string;
          paid_at?: string | null;
          payment_method?: string | null;
          reservation_id?: string | null;
          restaurant_id?: string;
          status?: Database["public"]["Enums"]["payment_status"] | null;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string | null;
          id: string;
          notes: string | null;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          restaurant_id: string;
          special_requests: string | null;
          status: Database["public"]["Enums"]["reservation_status"] | null;
          table_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          id?: string;
          notes?: string | null;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          restaurant_id: string;
          special_requests?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"] | null;
          table_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          id?: string;
          notes?: string | null;
          party_size?: number;
          reservation_date?: string;
          reservation_time?: string;
          restaurant_id?: string;
          special_requests?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"] | null;
          table_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          }
        ];
      };
      restaurant_staff: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean | null;
          restaurant_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          restaurant_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          restaurant_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      restaurant_tables: {
        Row: {
          capacity: number;
          created_at: string;
          id: string;
          is_active: boolean | null;
          position_x: number | null;
          position_y: number | null;
          restaurant_id: string;
          status: Database["public"]["Enums"]["table_status"] | null;
          table_number: string;
          updated_at: string;
        };
        Insert: {
          capacity: number;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          position_x?: number | null;
          position_y?: number | null;
          restaurant_id: string;
          status?: Database["public"]["Enums"]["table_status"] | null;
          table_number: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          position_x?: number | null;
          position_y?: number | null;
          restaurant_id?: string;
          status?: Database["public"]["Enums"]["table_status"] | null;
          table_number?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      restaurants: {
        Row: {
          address: string;
          created_at: string;
          cuisine_type: string | null;
          description: string | null;
          email: string | null;
          id: string;
          name: string;
          opening_hours: Json | null;
          owner_id: string;
          phone: string | null;
          settings: Json | null;
          updated_at: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          cuisine_type?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          opening_hours?: Json | null;
          owner_id: string;
          phone?: string | null;
          settings?: Json | null;
          updated_at?: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          cuisine_type?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          opening_hours?: Json | null;
          owner_id?: string;
          phone?: string | null;
          settings?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string | null;
          id: string;
          notes: string | null;
          party_size: number;
          preferred_date: string;
          preferred_time: string;
          restaurant_id: string;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          id?: string;
          notes?: string | null;
          party_size: number;
          preferred_date: string;
          preferred_time: string;
          restaurant_id: string;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          id?: string;
          notes?: string | null;
          party_size?: number;
          preferred_date?: string;
          preferred_time?: string;
          restaurant_id?: string;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      agenda_appointments: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          status: string;
          type: string;
          party_size: number | null;
          table_id: string | null;
          notes: string | null;
          restaurant_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          status?: string;
          type?: string;
          party_size?: number | null;
          table_id?: string | null;
          notes?: string | null;
          restaurant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          status?: string;
          type?: string;
          party_size?: number | null;
          table_id?: string | null;
          notes?: string | null;
          restaurant_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_appointments_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_appointments_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_restaurants: {
        Args: { _user_id: string };
        Returns: string[];
      };
      has_role: {
        Args: {
          _user_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "restaurant_owner" | "manager" | "staff" | "customer";
      payment_status: "pending" | "completed" | "failed" | "refunded";
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "cancelled"
        | "no_show";
      table_status:
        | "available"
        | "occupied"
        | "reserved"
        | "cleaning"
        | "out_of_order";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["restaurant_owner", "manager", "staff", "customer"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "no_show",
      ],
      table_status: [
        "available",
        "occupied",
        "reserved",
        "cleaning",
        "out_of_order",
      ],
    },
  },
} as const;

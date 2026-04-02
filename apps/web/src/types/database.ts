export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type LeadSource = "web" | "scraped" | "referral";
export type LeadStatus = "new" | "qualified" | "contacted" | "converted" | "lost";
export type PreferredLanguage = "en" | "fr";
export type ProjectType = "hvac" | "roofing" | "landscaping" | "renovations" | "plumbing" | "electrical" | "general" | "other";

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          appointment_date: string;
          appointment_time: string;
          client_email: string;
          client_name: string;
          client_phone: string | null;
          created_at: string;
          lead_id: string | null;
          notes: string | null;
          status: AppointmentStatus;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_date: string;
          appointment_time: string;
          client_email: string;
          client_name: string;
          client_phone?: string | null;
          created_at?: string;
          lead_id?: string | null;
          notes?: string | null;
          status?: AppointmentStatus;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      automated_logs: {
        Row: {
          id: string;
          channel: string;
          created_at: string;
          event_type: string;
          lead_id: string | null;
          metadata: Json | null;
          recipient: string | null;
          status: string;
          subject: string | null;
        };
        Insert: {
          id?: string;
          channel?: string;
          created_at?: string;
          event_type: string;
          lead_id?: string | null;
          metadata?: Json | null;
          recipient?: string | null;
          status?: string;
          subject?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["automated_logs"]["Insert"]>;
        Relationships: [];
      };
      email_send_log: {
        Row: {
          id: string;
          created_at: string;
          error_message: string | null;
          message_id: string | null;
          metadata: Json | null;
          recipient_email: string;
          status: string;
          template_name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          error_message?: string | null;
          message_id?: string | null;
          metadata?: Json | null;
          recipient_email: string;
          status: string;
          template_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_send_log"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          project_type: ProjectType;
          language: PreferredLanguage;
          source: LeadSource;
          status: LeadStatus;
          score: number | null;
          contractor_id: string | null;
          claimed_at: string | null;
          message: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          project_type: ProjectType;
          language?: PreferredLanguage;
          source?: LeadSource;
          status?: LeadStatus;
          score?: number | null;
          contractor_id?: string | null;
          claimed_at?: string | null;
          message?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          company_name: string | null;
          phone: string | null;
          role: string | null;
          services: string[] | null;
          city: string | null;
          subscription_tier: string | null;
          stripe_customer_id: string | null;
          telegram_chat_id: string | null;
          telegram_verification_code: string | null;
          telegram_bot_token: string | null;
          preferred_language: PreferredLanguage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          role?: string | null;
          services?: string[] | null;
          city?: string | null;
          subscription_tier?: string | null;
          stripe_customer_id?: string | null;
          telegram_chat_id?: string | null;
          telegram_verification_code?: string | null;
          telegram_bot_token?: string | null;
          preferred_language?: PreferredLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string; // starter, engine, dominator
          name: string;
          lead_limit: number | null;
          price_id: string | null;
          is_active: boolean;
          amount_monthly: number;
          features: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          lead_limit?: number | null;
          price_id?: string | null;
          is_active?: boolean;
          amount_monthly?: number;
          features?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>;
        Relationships: [];
      };
      lead_unlocks: {
        Row: {
          id: string;
          contractor_id: string;
          lead_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          lead_id: string;
          unlocked_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_unlocks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lead_unlocks_contractor_id_fkey";
            columns: ["contractor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_unlocks_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      scraped_inventory: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          permit_number: string | null;
          source: string | null;
          url: string | null;
          scraped_at: string;
          city: string | null;
          project_type: string | null;
          estimated_value: number | null;
          // Added in migration 20260326000001
          latitude: number | null;
          longitude: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          permit_number?: string | null;
          source?: string | null;
          url?: string | null;
          scraped_at?: string;
          city?: string | null;
          project_type?: string | null;
          estimated_value?: number | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["scraped_inventory"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      enqueue_email: { Args: { queue_name: string; payload: Json }; Returns: number };
      read_email_batch: { Args: { queue_name: string; batch_size: number; vt: number }; Returns: { msg_id: number; read_ct: number; message: Json }[] };
      delete_email: { Args: { queue_name: string; msg_id: number }; Returns: boolean };
      move_to_dlq: { Args: { queue_name: string; msg_id: number }; Returns: boolean };
      get_unlock_trends: { Args: Record<string, never>; Returns: { date: string; count: number }[] };
      get_unlock_city_stats: { Args: Record<string, never>; Returns: { city: string; count: number }[] };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      lead_source: LeadSource;
      lead_status: LeadStatus;
      preferred_language: PreferredLanguage;
      project_type: ProjectType;
    };
  };
}

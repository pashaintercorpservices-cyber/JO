export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_profile_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      agencies: {
        Row: {
          agency_name: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          license_number: string | null;
          profile_id: string;
          verified: boolean;
        };
        Insert: {
          agency_name: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          license_number?: string | null;
          profile_id: string;
          verified?: boolean;
        };
        Update: {
          agency_name?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          license_number?: string | null;
          profile_id?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          applicant_profile_id: string | null;
          consent: boolean;
          created_at: string;
          email: string;
          id: string;
          job_ad_id: string;
          name: string;
          phone: string;
          position_applied: string;
          resume_url: string | null;
          source: "guest" | "account";
        };
        Insert: {
          applicant_profile_id?: string | null;
          consent?: boolean;
          created_at?: string;
          email: string;
          id?: string;
          job_ad_id: string;
          name: string;
          phone: string;
          position_applied: string;
          resume_url?: string | null;
          source?: "guest" | "account";
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [];
      };
      job_ads: {
        Row: {
          agency_id: string;
          city: string | null;
          contact_email: string;
          country: string;
          created_at: string;
          description: string | null;
          employer_name: string | null;
          id: string;
          image_url: string | null;
          promo_status: "not_started" | "scheduled" | "running" | "completed";
          published_at: string | null;
          status:
            | "pending_payment"
            | "pending_approval"
            | "live"
            | "paused"
            | "rejected"
            | "closed";
          title: string;
          vacancies: number | null;
        };
        Insert: {
          agency_id: string;
          city?: string | null;
          contact_email: string;
          country: string;
          created_at?: string;
          description?: string | null;
          employer_name?: string | null;
          id?: string;
          image_url?: string | null;
          promo_status?: "not_started" | "scheduled" | "running" | "completed";
          published_at?: string | null;
          status?:
            | "pending_payment"
            | "pending_approval"
            | "live"
            | "paused"
            | "rejected"
            | "closed";
          title: string;
          vacancies?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_ads"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          agency_id: string;
          amount_paise: number;
          created_at: string;
          id: string;
          job_ad_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          status: "created" | "paid" | "failed";
        };
        Insert: {
          agency_id: string;
          amount_paise?: number;
          created_at?: string;
          id?: string;
          job_ad_id: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          status?: "created" | "paid" | "failed";
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: "agency" | "candidate" | "admin";
          is_super_admin: boolean;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: "agency" | "candidate" | "admin";
          is_super_admin?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      agency_id_for_current_user: { Args: Record<string, never>; Returns: string };
      register_as_agency: {
        Args: {
          p_agency_name: string;
          p_contact_phone: string;
          p_license_number?: string | null;
        };
        Returns: string;
      };
      confirm_ad_payment: {
        Args: {
          p_payment_id: string;
          p_razorpay_order_id: string;
          p_razorpay_payment_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      ad_status:
        | "pending_payment"
        | "pending_approval"
        | "live"
        | "paused"
        | "rejected"
        | "closed";
      application_source: "guest" | "account";
      payment_status: "created" | "paid" | "failed";
      promo_status: "not_started" | "scheduled" | "running" | "completed";
      user_role: "agency" | "candidate" | "admin";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

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
          availability_confirmed: boolean;
          consent: boolean;
          created_at: string;
          email: string;
          id: string;
          job_ad_id: string;
          job_vacancy_id: string | null;
          match_score: number | null;
          match_summary: string | null;
          match_score_error: string | null;
          name: string;
          phone: string;
          position_applied: string;
          resume_confirmed: boolean;
          resume_url: string | null;
          source: "guest" | "account";
          suitability_answer: string | null;
          video_intro_seconds: number | null;
          video_intro_url: string | null;
        };
        Insert: {
          applicant_profile_id?: string | null;
          availability_confirmed?: boolean;
          consent?: boolean;
          created_at?: string;
          email: string;
          id?: string;
          job_ad_id: string;
          job_vacancy_id?: string | null;
          match_score?: number | null;
          match_summary?: string | null;
          match_score_error?: string | null;
          name: string;
          phone: string;
          position_applied: string;
          resume_confirmed?: boolean;
          resume_url?: string | null;
          source?: "guest" | "account";
          suitability_answer?: string | null;
          video_intro_seconds?: number | null;
          video_intro_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [];
      };
      job_vacancies: {
        Row: {
          city: string | null;
          country: string;
          created_at: string;
          details: string | null;
          id: string;
          job_ad_id: string;
          require_video_intro: boolean;
          salary_range: string | null;
          title: string;
          vacancies: number | null;
        };
        Insert: {
          city?: string | null;
          country: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          job_ad_id: string;
          require_video_intro?: boolean;
          salary_range?: string | null;
          title: string;
          vacancies?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_vacancies"]["Insert"]>;
        Relationships: [];
      };
      job_ads: {
        Row: {
          agency_id: string;
          city: string | null;
          contact_email: string;
          contact_name: string | null;
          contact_phone: string | null;
          country: string;
          created_at: string;
          description: string | null;
          employer_name: string | null;
          id: string;
          image_url: string | null;
          min_match_score: number | null;
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
          contact_name?: string | null;
          contact_phone?: string | null;
          country: string;
          created_at?: string;
          description?: string | null;
          employer_name?: string | null;
          id?: string;
          image_url?: string | null;
          min_match_score?: number | null;
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
          base_amount_paise: number | null;
          created_at: string;
          discount_code: string | null;
          discount_percent: number | null;
          id: string;
          job_ad_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          status: "created" | "paid" | "failed";
        };
        Insert: {
          agency_id: string;
          amount_paise?: number;
          base_amount_paise?: number | null;
          created_at?: string;
          discount_code?: string | null;
          discount_percent?: number | null;
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
      chat_sessions: {
        Row: {
          id: string;
          visitor_type: "agency" | "jobseeker" | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          visitor_type?: "agency" | "jobseeker" | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          last_message_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_sessions"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          session_id: string | null;
          visitor_type: "agency" | "jobseeker" | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          subject: string;
          chat_summary: string;
          status: "open" | "escalated" | "resolved";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          visitor_type?: "agency" | "jobseeker" | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          subject: string;
          chat_summary: string;
          status?: "open" | "escalated" | "resolved";
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
        Relationships: [];
      };
      support_ticket_replies: {
        Row: {
          id: string;
          ticket_id: string;
          sender: "ai_auto" | "support_team";
          body: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender: "ai_auto" | "support_team";
          body: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_ticket_replies"]["Insert"]>;
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
      visitor_type: "agency" | "jobseeker";
      ticket_status: "open" | "escalated" | "resolved";
    };
    CompositeTypes: { [_ in never]: never };
  };
  ops: {
    Tables: {
      admin_api_tokens: {
        Row: {
          token: string;
          purpose: string;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          token: string;
          purpose: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: Partial<Database["ops"]["Tables"]["admin_api_tokens"]["Insert"]>;
        Relationships: [];
      };
      email_outreach_log: {
        Row: {
          id: string;
          role_id: string;
          campaign: string;
          source_row: number;
          agency_name: string;
          agency_email: string;
          location: string | null;
          status: "sent" | "failed";
          error_message: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          campaign?: string;
          source_row: number;
          agency_name: string;
          agency_email: string;
          location?: string | null;
          status: "sent" | "failed";
          error_message?: string | null;
          sent_at?: string;
        };
        Update: Partial<Database["ops"]["Tables"]["email_outreach_log"]["Insert"]>;
        Relationships: [];
      };
      outreach_agencies: {
        Row: {
          source_row: number;
          agency_name: string;
          agency_email: string;
          location: string | null;
          sent: boolean;
        };
        Insert: {
          source_row: number;
          agency_name: string;
          agency_email: string;
          location?: string | null;
          sent?: boolean;
        };
        Update: Partial<Database["ops"]["Tables"]["outreach_agencies"]["Insert"]>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          department_id: string;
          title: string;
          kind: "manager" | "employee";
          subagent_name: string;
          parent_role_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          department_id: string;
          title: string;
          kind: "manager" | "employee";
          subagent_name: string;
          parent_role_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["ops"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          role_id: string;
          report_date: string;
          summary: string;
          details: Record<string, unknown> | null;
          recommendations: unknown[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          report_date?: string;
          summary: string;
          details?: Record<string, unknown> | null;
          recommendations?: unknown[] | null;
          created_at?: string;
        };
        Update: Partial<Database["ops"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          role_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["ops"]["Tables"]["activity_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

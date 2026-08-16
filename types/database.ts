export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tax_accountants: {
        Relationships: [];
        Row: {
          id: string;
          slug: string;
          office_name: string;
          representative_name: string | null;
          sido: string;
          sigungu: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          specialties: string[] | null;
          bio: string | null;
          tier: string | null;
          photo_url: string | null;
          review_count: number | null;
          review_avg: number | null;
          is_premium: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          verification_status: "public_record" | "findtax_verified";
          source_name: string | null;
          source_url: string | null;
          last_verified_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          office_name: string;
          representative_name?: string | null;
          sido: string;
          sigungu: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          specialties?: string[] | null;
          bio?: string | null;
          tier?: string | null;
          photo_url?: string | null;
          review_count?: number | null;
          review_avg?: number | null;
          is_premium?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          verification_status?: "public_record" | "findtax_verified";
          source_name?: string | null;
          source_url?: string | null;
          last_verified_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          office_name?: string;
          representative_name?: string | null;
          sido?: string;
          sigungu?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          specialties?: string[] | null;
          bio?: string | null;
          tier?: string | null;
          photo_url?: string | null;
          review_count?: number | null;
          review_avg?: number | null;
          is_premium?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          verification_status?: "public_record" | "findtax_verified";
          source_name?: string | null;
          source_url?: string | null;
          last_verified_at?: string | null;
        };
      };
      leads: {
        Relationships: [
          {
            foreignKeyName: "leads_target_accountant_id_fkey";
            columns: ["target_accountant_id"];
            isOneToOne: false;
            referencedRelation: "tax_accountants";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          sido: string;
          sigungu: string;
          situation: string;
          message: string | null;
          target_accountant_id: string | null;
          status: "new" | "contacted" | "closed";
          created_at: string;
          category: string | null;
          business_type: string | null;
          monthly_revenue: string | null;
          industry: string | null;
          has_accountant: string | null;
          employee_count: number | null;
          lead_quality: string | null;
          workflow_status: "new" | "assigned" | "contacted" | "consulting" | "completed" | "closed";
          assigned_partner_id: string | null;
          public_tracking_token: string;
          contacted_at: string | null;
          completed_at: string | null;
          closed_at: string | null;
          admin_note: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          sido: string;
          sigungu: string;
          situation: string;
          message?: string | null;
          target_accountant_id?: string | null;
          status?: "new" | "contacted" | "closed";
          created_at?: string;
          category?: string | null;
          business_type?: string | null;
          monthly_revenue?: string | null;
          industry?: string | null;
          has_accountant?: string | null;
          employee_count?: number | null;
          lead_quality?: string | null;
          workflow_status?: "new" | "assigned" | "contacted" | "consulting" | "completed" | "closed";
          assigned_partner_id?: string | null;
          public_tracking_token?: string;
          contacted_at?: string | null;
          completed_at?: string | null;
          closed_at?: string | null;
          admin_note?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          sido?: string;
          sigungu?: string;
          situation?: string;
          message?: string | null;
          target_accountant_id?: string | null;
          status?: "new" | "contacted" | "closed";
          created_at?: string;
          category?: string | null;
          business_type?: string | null;
          monthly_revenue?: string | null;
          industry?: string | null;
          has_accountant?: string | null;
          employee_count?: number | null;
          lead_quality?: string | null;
          workflow_status?: "new" | "assigned" | "contacted" | "consulting" | "completed" | "closed";
          assigned_partner_id?: string | null;
          public_tracking_token?: string;
          contacted_at?: string | null;
          completed_at?: string | null;
          closed_at?: string | null;
          admin_note?: string | null;
          updated_at?: string;
        };
      };
      tracking_events: {
        Relationships: [];
        Row: {
          id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
      };
      app_settings: {
        Relationships: [];
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      partner_routing_counters: {
        Relationships: [];
        Row: {
          region_key: string;
          cursor: number;
          updated_at: string;
        };
        Insert: {
          region_key: string;
          cursor?: number;
          updated_at?: string;
        };
        Update: {
          region_key?: string;
          cursor?: number;
          updated_at?: string;
        };
      };
      partners: {
        Relationships: [
          {
            foreignKeyName: "partners_referrer_partner_id_fkey";
            columns: ["referrer_partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          user_id: string;
          professional_type: Database["public"]["Enums"]["partner_professional_type"];
          license_number_normalized: string;
          license_display: string;
          office_name: string;
          representative_name: string | null;
          sido: string;
          sigungu: string;
          specialties: string[];
          status: Database["public"]["Enums"]["partner_status"];
          points_balance: number;
          is_founder: boolean;
          founder_discount_until: string | null;
          referrer_partner_id: string | null;
          referral_reward_processed_at: string | null;
          approval_events_processed_at: string | null;
          rejection_reason: string | null;
          approved_at: string | null;
          referral_code: string | null;
          created_at: string;
          updated_at: string;
          response_rate: number;
          total_assigned: number;
          total_accepted: number;
          is_limited: boolean;
          consecutive_expired: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          professional_type: Database["public"]["Enums"]["partner_professional_type"];
          license_number_normalized: string;
          license_display: string;
          office_name: string;
          representative_name?: string | null;
          sido: string;
          sigungu: string;
          specialties?: string[];
          status?: Database["public"]["Enums"]["partner_status"];
          points_balance?: number;
          is_founder?: boolean;
          founder_discount_until?: string | null;
          referrer_partner_id?: string | null;
          referral_reward_processed_at?: string | null;
          approval_events_processed_at?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          referral_code?: string | null;
          created_at?: string;
          updated_at?: string;
          response_rate?: number;
          total_assigned?: number;
          total_accepted?: number;
          is_limited?: boolean;
          consecutive_expired?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          professional_type?: Database["public"]["Enums"]["partner_professional_type"];
          license_number_normalized?: string;
          license_display?: string;
          office_name?: string;
          representative_name?: string | null;
          sido?: string;
          sigungu?: string;
          specialties?: string[];
          status?: Database["public"]["Enums"]["partner_status"];
          points_balance?: number;
          is_founder?: boolean;
          founder_discount_until?: string | null;
          referrer_partner_id?: string | null;
          referral_reward_processed_at?: string | null;
          approval_events_processed_at?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          referral_code?: string | null;
          created_at?: string;
          updated_at?: string;
          response_rate?: number;
          total_assigned?: number;
          total_accepted?: number;
          is_limited?: boolean;
          consecutive_expired?: number;
        };
      };
      partner_documents: {
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          partner_id: string;
          doc_type: Database["public"]["Enums"]["partner_doc_type"];
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          doc_type: Database["public"]["Enums"]["partner_doc_type"];
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          doc_type?: Database["public"]["Enums"]["partner_doc_type"];
          storage_path?: string;
          created_at?: string;
        };
      };
      point_ledger: {
        Relationships: [
          {
            foreignKeyName: "point_ledger_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "point_ledger_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          partner_id: string;
          amount: number;
          balance_after: number;
          entry_type: Database["public"]["Enums"]["point_ledger_entry_type"];
          lead_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          amount: number;
          balance_after: number;
          entry_type: Database["public"]["Enums"]["point_ledger_entry_type"];
          lead_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          amount?: number;
          balance_after?: number;
          entry_type?: Database["public"]["Enums"]["point_ledger_entry_type"];
          lead_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
      };
      partner_point_recharge_requests: {
        Relationships: [
          {
            foreignKeyName: "partner_point_recharge_requests_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          partner_id: string;
          requested_amount: number;
          depositor_name: string;
          partner_memo: string | null;
          tax_invoice_company_name: string;
          tax_invoice_business_reg_no: string;
          tax_invoice_email: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          requested_amount: number;
          depositor_name: string;
          partner_memo?: string | null;
          tax_invoice_company_name: string;
          tax_invoice_business_reg_no: string;
          tax_invoice_email: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          requested_amount?: number;
          depositor_name?: string;
          partner_memo?: string | null;
          tax_invoice_company_name?: string;
          tax_invoice_business_reg_no?: string;
          tax_invoice_email?: string;
          status?: string;
          created_at?: string;
        };
      };
      lead_partner_assignments: {
        Relationships: [
          {
            foreignKeyName: "lead_partner_assignments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_partner_assignments_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          lead_id: string;
          partner_id: string;
          assigned_score: number;
          unlocked_at: string | null;
          unlock_points_charged: number;
          created_at: string;
          match_status: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          partner_id: string;
          assigned_score?: number;
          unlocked_at?: string | null;
          unlock_points_charged?: number;
          created_at?: string;
          match_status?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          partner_id?: string;
          assigned_score?: number;
          unlocked_at?: string | null;
          unlock_points_charged?: number;
          created_at?: string;
          match_status?: string;
          expires_at?: string | null;
        };
      };
      partner_pricing_waitlist: {
        Relationships: [];
        Row: {
          id: string;
          email: string;
          plan_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          plan_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan_key?: string;
          created_at?: string;
        };
      };
      partner_applications: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          office_name: string;
          phone: string;
          email: string;
          address: string;
          specialties: string[];
          plan: "FREE" | "STANDARD" | "PREMIUM";
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          office_name: string;
          phone: string;
          email: string;
          address: string;
          specialties?: string[];
          plan: "FREE" | "STANDARD" | "PREMIUM";
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          office_name?: string;
          phone?: string;
          email?: string;
          address?: string;
          specialties?: string[];
          plan?: "FREE" | "STANDARD" | "PREMIUM";
          bio?: string | null;
          created_at?: string;
        };
      };
      tax_cases: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string | null;
          access_token: string;
          client_dedupe_key: string;
          case_type: "vat" | "gift" | "solo_business" | "pension" | "seller";
          title: string;
          status: "preparing" | "ready" | "completed";
          readiness_score: number;
          complexity_score: number;
          recommendation: "self" | "review" | "tax_accountant";
          source_path: string | null;
          filing_period_label: string | null;
          filing_deadline: string | null;
          reminder_enabled: boolean;
          reminder_days: number[];
          reminder_updated_at: string | null;
          filing_method: "undecided" | "direct" | "professional";
          filing_completed_at: string | null;
          hometax_opened_at: string | null;
          consultation_opened_at: string | null;
          case_context: Json;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          access_token?: string;
          client_dedupe_key: string;
          case_type: "vat" | "gift" | "solo_business" | "pension";
          title: string;
          status?: "preparing" | "ready" | "completed";
          readiness_score?: number;
          complexity_score?: number;
          recommendation: "self" | "review" | "tax_accountant";
          source_path?: string | null;
          filing_period_label?: string | null;
          filing_deadline?: string | null;
          reminder_enabled?: boolean;
          reminder_days?: number[];
          reminder_updated_at?: string | null;
          filing_method?: "undecided" | "direct" | "professional";
          filing_completed_at?: string | null;
          hometax_opened_at?: string | null;
          consultation_opened_at?: string | null;
          case_context?: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          access_token?: string;
          client_dedupe_key?: string;
          case_type?: "vat" | "gift" | "solo_business" | "pension";
          title?: string;
          status?: "preparing" | "ready" | "completed";
          readiness_score?: number;
          complexity_score?: number;
          recommendation?: "self" | "review" | "tax_accountant";
          source_path?: string | null;
          filing_period_label?: string | null;
          filing_deadline?: string | null;
          reminder_enabled?: boolean;
          reminder_days?: number[];
          reminder_updated_at?: string | null;
          filing_method?: "undecided" | "direct" | "professional";
          filing_completed_at?: string | null;
          hometax_opened_at?: string | null;
          consultation_opened_at?: string | null;
          case_context?: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tax_case_assessments: {
        Relationships: [
          {
            foreignKeyName: "tax_case_assessments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "tax_cases";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          case_id: string;
          snapshot_version: number;
          rule_version: string;
          input_json: Json;
          result_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          snapshot_version?: number;
          rule_version: string;
          input_json?: Json;
          result_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          snapshot_version?: number;
          rule_version?: string;
          input_json?: Json;
          result_json?: Json;
          created_at?: string;
        };
      };
      tax_case_tasks: {
        Relationships: [
          {
            foreignKeyName: "tax_case_tasks_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "tax_cases";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          case_id: string;
          task_key: string;
          label: string;
          description: string;
          status: "ready" | "not_ready" | "unsure";
          weight: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          task_key: string;
          label: string;
          description: string;
          status?: "ready" | "not_ready" | "unsure";
          weight: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          task_key?: string;
          label?: string;
          description?: string;
          status?: "ready" | "not_ready" | "unsure";
          weight?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tax_case_reminder_deliveries: {
        Relationships: [
          {
            foreignKeyName: "tax_case_reminder_deliveries_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "tax_cases";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          filing_deadline: string;
          days_before: number;
          status: "pending" | "sent" | "failed" | "skipped";
          provider_message_id: string | null;
          error_code: string | null;
          attempted_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          filing_deadline: string;
          days_before: number;
          status?: "pending" | "sent" | "failed" | "skipped";
          provider_message_id?: string | null;
          error_code?: string | null;
          attempted_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          filing_deadline?: string;
          days_before?: number;
          status?: "pending" | "sent" | "failed" | "skipped";
          provider_message_id?: string | null;
          error_code?: string | null;
          attempted_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      tax_case_documents: {
        Relationships: [
          {
            foreignKeyName: "tax_case_documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "tax_cases";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          case_id: string;
          document_key: string;
          label: string;
          description: string;
          reason: string;
          required: boolean;
          status: "pending" | "ready";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          document_key: string;
          label: string;
          description: string;
          reason: string;
          required?: boolean;
          status?: "pending" | "ready";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          document_key?: string;
          label?: string;
          description?: string;
          reason?: string;
          required?: boolean;
          status?: "pending" | "ready";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_posts: {
        Relationships: [];
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string;
          seo_title: string | null;
          seo_description: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      api_get_tax_case_v2: {
        Args: { p_access_token: string };
        Returns: Json;
      };
      api_create_guided_tax_case_v1: {
        Args: {
          p_client_dedupe_key: string;
          p_case_type: string;
          p_source_path: string | null;
          p_input_json: Json;
          p_result_json: Json;
          p_complexity_score: number;
          p_recommendation: string;
          p_rule_version: string;
          p_filing_period_label: string;
          p_filing_deadline: string;
          p_tasks: Json;
          p_documents: Json;
        };
        Returns: Json;
      };
      api_update_tax_case_task_v2: {
        Args: {
          p_access_token: string;
          p_task_key: string;
          p_status: string;
        };
        Returns: Json;
      };
      api_update_tax_case_document_v2: {
        Args: {
          p_access_token: string;
          p_document_key: string;
          p_status: string;
        };
        Returns: Json;
      };
      api_set_tax_case_filing_method_v2: {
        Args: {
          p_access_token: string;
          p_filing_method: string;
        };
        Returns: Json;
      };
      api_complete_tax_case_v2: {
        Args: { p_access_token: string };
        Returns: Json;
      };
      api_complete_tax_case_v3: {
        Args: {
          p_access_token: string;
          p_completion_outcome: string;
          p_actual_tax_amount_won: number | null;
          p_completion_blocker: string;
          p_completion_note: string;
        };
        Returns: Json;
      };
      api_record_tax_case_action_v2: {
        Args: {
          p_access_token: string;
          p_action: string;
        };
        Returns: Json;
      };
      api_claim_tax_case_v2: {
        Args: { p_access_token: string };
        Returns: boolean;
      };
      api_list_my_tax_cases_v2: {
        Args: Record<string, never>;
        Returns: Json;
      };
      api_update_tax_case_deadline_v2: {
        Args: {
          p_access_token: string;
          p_filing_period_label: string;
          p_filing_deadline: string;
          p_reminder_enabled: boolean;
          p_reminder_days: number[];
        };
        Returns: Json;
      };
      api_create_vat_tax_case_v1: {
        Args: {
          p_client_dedupe_key: string;
          p_source_path: string | null;
          p_decision_input: Json;
          p_readiness_answers: Json;
          p_complexity_score: number;
          p_recommendation: string;
          p_rule_version: string;
        };
        Returns: Json;
      };
      api_get_vat_tax_case_v1: {
        Args: { p_access_token: string };
        Returns: Json;
      };
      api_claim_vat_tax_case_v1: {
        Args: { p_access_token: string };
        Returns: boolean;
      };
      api_list_my_vat_tax_cases_v1: {
        Args: Record<string, never>;
        Returns: Json;
      };
      api_update_vat_tax_case_task_v1: {
        Args: {
          p_access_token: string;
          p_task_key: string;
          p_status: string;
        };
        Returns: Json;
      };
      api_update_vat_tax_case_deadline_v1: {
        Args: {
          p_access_token: string;
          p_filing_period_label: string;
          p_filing_deadline: string;
          p_reminder_enabled: boolean;
          p_reminder_days: number[];
        };
        Returns: Json;
      };
      api_update_vat_tax_case_document_v1: {
        Args: {
          p_access_token: string;
          p_document_key: string;
          p_status: string;
        };
        Returns: Json;
      };
      api_set_vat_filing_method_v1: {
        Args: {
          p_access_token: string;
          p_filing_method: string;
        };
        Returns: Json;
      };
      api_complete_vat_tax_case_v1: {
        Args: { p_access_token: string };
        Returns: Json;
      };
      api_record_vat_tax_case_action_v1: {
        Args: {
          p_access_token: string;
          p_action: string;
        };
        Returns: Json;
      };
      api_admin_insights_snapshot_v1: {
        Args: { p_since: string };
        Returns: Json;
      };
      api_claim_due_tax_case_reminders_v1: {
        Args: {
          p_cron_token: string;
          p_run_date: string;
        };
        Returns: {
          delivery_id: string;
          case_id: string;
          case_type: "vat" | "gift" | "solo_business" | "pension";
          user_id: string;
          user_email: string;
          access_token: string;
          filing_period_label: string;
          filing_deadline: string;
          days_before: number;
          readiness_score: number;
        }[];
      };
      api_complete_tax_case_reminder_v1: {
        Args: {
          p_cron_token: string;
          p_delivery_id: string;
          p_status: string;
          p_provider_message_id?: string | null;
          p_error_code?: string | null;
        };
        Returns: boolean;
      };
      rpc_claim_due_tax_case_reminders: {
        Args: { p_run_date: string };
        Returns: {
          delivery_id: string;
          case_id: string;
          user_id: string;
          access_token: string;
          filing_period_label: string;
          filing_deadline: string;
          days_before: number;
          readiness_score: number;
        }[];
      };
      rpc_public_founder_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_public_list_partners: {
        Args: { p_sido: string; p_sigungu?: string | null };
        Returns: {
          id: string;
          office_name: string;
          representative_name: string | null;
          sido: string;
          sigungu: string;
          specialties: string[];
          is_founder: boolean;
        }[];
      };
      rpc_submit_lead: {
        Args: {
          p_name: string;
          p_phone: string;
          p_email: string | null;
          p_sido: string;
          p_sigungu: string;
          p_situation: string;
          p_message: string | null;
          p_target_accountant_id: string | null;
          p_category: string | null;
          p_business_type: string | null;
          p_monthly_revenue: string | null;
          p_industry: string | null;
          p_has_accountant: string | null;
          p_employee_count: number | null;
          p_lead_quality: string | null;
        };
        Returns: Database["public"]["Tables"]["leads"]["Row"][];
      };
      rpc_public_site_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_submit_partner_application: {
        Args: {
          p_name: string;
          p_office_name: string;
          p_phone: string;
          p_email: string;
          p_address: string;
          p_specialties: string[];
          p_plan: string;
          p_bio: string | null;
        };
        Returns: undefined;
      };
      rpc_partner_license_available: {
        Args: {
          p_license_normalized: string;
          p_professional: Database["public"]["Enums"]["partner_professional_type"];
        };
        Returns: boolean;
      };
      rpc_admin_approve_partner: {
        Args: { p_partner_id: string };
        Returns: Json;
      };
      rpc_admin_reject_partner: {
        Args: { p_partner_id: string; p_reason: string };
        Returns: Json;
      };
      rpc_partner_unlock_lead: {
        Args: { p_lead_id: string };
        Returns: Json;
      };
      rpc_partner_list_my_leads: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_cron_expire_lead_assignments: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_refill_lead_assignments: {
        Args: { p_lead_id: string };
        Returns: number;
      };
      rpc_partner_today_leads_same_sido: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_partner_activity_score: {
        Args: Record<string, never>;
        Returns: Json;
      };
      rpc_admin_adjust_points: {
        Args: { p_partner_id: string; p_amount: number; p_reason: string };
        Returns: Json;
      };
    };
    Enums: {
      lead_status: "new" | "contacted" | "closed";
      partner_professional_type: "tax_advisor" | "cpa";
      partner_status: "pending" | "approved" | "rejected";
      partner_doc_type: "certificate" | "business_license";
      point_ledger_entry_type:
        | "founder_bonus"
        | "referral_reward"
        | "referral_blocked"
        | "lead_unlock"
        | "lead_unlock_discount"
        | "admin_adjustment";
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artefact_versions: {
        Row: {
          artefact_id: string
          body: string
          content: Json
          created_at: string
          id: string
          owner_id: string
          version: number
        }
        Insert: {
          artefact_id: string
          body: string
          content?: Json
          created_at?: string
          id?: string
          owner_id: string
          version: number
        }
        Update: {
          artefact_id?: string
          body?: string
          content?: Json
          created_at?: string
          id?: string
          owner_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "artefact_versions_artefact_id_fkey"
            columns: ["artefact_id"]
            isOneToOne: false
            referencedRelation: "artefacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artefacts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          organisation_id: string | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          organisation_id?: string | null
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          organisation_id?: string | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artefacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      attestations: {
        Row: {
          attestor_email: string
          attestor_name: string
          claim_id: string
          created_at: string
          id: string
          owner_id: string
          relationship: string | null
          requested_at: string
          responded_at: string | null
          state: Database["public"]["Enums"]["attestation_state"]
          statement: string | null
          token: string
          updated_at: string
        }
        Insert: {
          attestor_email: string
          attestor_name: string
          claim_id: string
          created_at?: string
          id?: string
          owner_id: string
          relationship?: string | null
          requested_at?: string
          responded_at?: string | null
          state?: Database["public"]["Enums"]["attestation_state"]
          statement?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          attestor_email?: string
          attestor_name?: string
          claim_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          relationship?: string | null
          requested_at?: string
          responded_at?: string | null
          state?: Database["public"]["Enums"]["attestation_state"]
          statement?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attestations_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "snapshot_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_frameworks: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
          status?: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
      capability_judgements: {
        Row: {
          band: Database["public"]["Enums"]["confidence_band"]
          capability_key: string
          created_at: string
          evidence_ids: string[]
          id: string
          level: number
          owner_id: string
          rationale: string
          score_run_id: string
        }
        Insert: {
          band: Database["public"]["Enums"]["confidence_band"]
          capability_key: string
          created_at?: string
          evidence_ids?: string[]
          id?: string
          level: number
          owner_id: string
          rationale: string
          score_run_id: string
        }
        Update: {
          band?: Database["public"]["Enums"]["confidence_band"]
          capability_key?: string
          created_at?: string
          evidence_ids?: string[]
          id?: string
          level?: number
          owner_id?: string
          rationale?: string
          score_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capability_judgements_score_run_id_fkey"
            columns: ["score_run_id"]
            isOneToOne: false
            referencedRelation: "score_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_ledger: {
        Row: {
          artefact_version_id: string | null
          capability_key: string | null
          created_at: string
          id: string
          occurred_at: string
          organisation_id: string | null
          owner_id: string
          provenance: Json
          source: Database["public"]["Enums"]["evidence_source"]
          strength: Database["public"]["Enums"]["evidence_strength"]
          summary: string
        }
        Insert: {
          artefact_version_id?: string | null
          capability_key?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          organisation_id?: string | null
          owner_id: string
          provenance?: Json
          source: Database["public"]["Enums"]["evidence_source"]
          strength: Database["public"]["Enums"]["evidence_strength"]
          summary: string
        }
        Update: {
          artefact_version_id?: string | null
          capability_key?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          organisation_id?: string | null
          owner_id?: string
          provenance?: Json
          source?: Database["public"]["Enums"]["evidence_source"]
          strength?: Database["public"]["Enums"]["evidence_strength"]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_ledger_artefact_version_id_fkey"
            columns: ["artefact_version_id"]
            isOneToOne: false
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_ledger_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_capabilities: {
        Row: {
          created_at: string
          description: string | null
          framework_id: string
          id: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          framework_id: string
          id?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          framework_id?: string
          id?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "framework_capabilities_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "capability_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organisation_id: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organisation_id: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organisation_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_memberships: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          headline: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      score_runs: {
        Row: {
          created_at: string
          framework_id: string
          id: string
          notes: string | null
          owner_id: string
          run_kind: Database["public"]["Enums"]["score_run_kind"]
          status: string
        }
        Insert: {
          created_at?: string
          framework_id: string
          id?: string
          notes?: string | null
          owner_id: string
          run_kind: Database["public"]["Enums"]["score_run_kind"]
          status?: string
        }
        Update: {
          created_at?: string
          framework_id?: string
          id?: string
          notes?: string | null
          owner_id?: string
          run_kind?: Database["public"]["Enums"]["score_run_kind"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_runs_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "capability_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshot_claims: {
        Row: {
          attestation_status: Database["public"]["Enums"]["attestation_status"]
          band: Database["public"]["Enums"]["confidence_band"] | null
          capability_key: string
          created_at: string
          evidence_strength: Database["public"]["Enums"]["evidence_strength"]
          framework_id: string
          id: string
          level: number | null
          owner_id: string
          readiness_basis: string
          score_run_id: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          attestation_status?: Database["public"]["Enums"]["attestation_status"]
          band?: Database["public"]["Enums"]["confidence_band"] | null
          capability_key: string
          created_at?: string
          evidence_strength?: Database["public"]["Enums"]["evidence_strength"]
          framework_id: string
          id?: string
          level?: number | null
          owner_id: string
          readiness_basis?: string
          score_run_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          attestation_status?: Database["public"]["Enums"]["attestation_status"]
          band?: Database["public"]["Enums"]["confidence_band"] | null
          capability_key?: string
          created_at?: string
          evidence_strength?: Database["public"]["Enums"]["evidence_strength"]
          framework_id?: string
          id?: string
          level?: number | null
          owner_id?: string
          readiness_basis?: string
          score_run_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshot_claims_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "capability_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snapshot_claims_score_run_id_fkey"
            columns: ["score_run_id"]
            isOneToOne: false
            referencedRelation: "score_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attestation_state: "pending" | "confirmed" | "declined" | "disputed"
      attestation_status:
        | "unattested"
        | "attestation_requested"
        | "externally_attested"
        | "disputed"
      confidence_band: "low" | "moderate" | "high"
      evidence_source:
        | "self_report"
        | "ai_draft"
        | "experience_sim"
        | "workspace_contribution"
        | "assessment"
        | "external_verification"
        | "coaching_submission"
      evidence_strength:
        | "self_reported"
        | "observed"
        | "assessed"
        | "externally_verified"
      score_run_kind: "baseline" | "interim" | "final" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      attestation_state: ["pending", "confirmed", "declined", "disputed"],
      attestation_status: [
        "unattested",
        "attestation_requested",
        "externally_attested",
        "disputed",
      ],
      confidence_band: ["low", "moderate", "high"],
      evidence_source: [
        "self_report",
        "ai_draft",
        "experience_sim",
        "workspace_contribution",
        "assessment",
        "external_verification",
        "coaching_submission",
      ],
      evidence_strength: [
        "self_reported",
        "observed",
        "assessed",
        "externally_verified",
      ],
      score_run_kind: ["baseline", "interim", "final", "transfer"],
    },
  },
} as const

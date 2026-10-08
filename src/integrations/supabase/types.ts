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
      answer_claims: {
        Row: {
          answer_id: string
          claim_text: string
          claim_type: string
          created_at: string
          id: string
          matched_evidence_id: string | null
          owner_id: string
          record_excerpt: string | null
          signal_level: string
          support_status: string
        }
        Insert: {
          answer_id: string
          claim_text: string
          claim_type: string
          created_at?: string
          id?: string
          matched_evidence_id?: string | null
          owner_id: string
          record_excerpt?: string | null
          signal_level?: string
          support_status: string
        }
        Update: {
          answer_id?: string
          claim_text?: string
          claim_type?: string
          created_at?: string
          id?: string
          matched_evidence_id?: string | null
          owner_id?: string
          record_excerpt?: string | null
          signal_level?: string
          support_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_claims_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "interview_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_claims_matched_evidence_id_fkey"
            columns: ["matched_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
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
          artefact_version_id: string | null
          attestation_level: string | null
          attestor_email: string
          attestor_name: string
          claim_id: string
          created_at: string
          id: string
          owner_id: string
          relationship: string | null
          renewal_due_at: string | null
          requested_at: string
          responded_at: string | null
          state: Database["public"]["Enums"]["attestation_state"]
          statement: string | null
          statement_key: string | null
          token: string
          updated_at: string
        }
        Insert: {
          artefact_version_id?: string | null
          attestation_level?: string | null
          attestor_email: string
          attestor_name: string
          claim_id: string
          created_at?: string
          id?: string
          owner_id: string
          relationship?: string | null
          renewal_due_at?: string | null
          requested_at?: string
          responded_at?: string | null
          state?: Database["public"]["Enums"]["attestation_state"]
          statement?: string | null
          statement_key?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          artefact_version_id?: string | null
          attestation_level?: string | null
          attestor_email?: string
          attestor_name?: string
          claim_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          relationship?: string | null
          renewal_due_at?: string | null
          requested_at?: string
          responded_at?: string | null
          state?: Database["public"]["Enums"]["attestation_state"]
          statement?: string | null
          statement_key?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attestations_artefact_version_id_fkey"
            columns: ["artefact_version_id"]
            isOneToOne: false
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
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
      coach_reviews: {
        Row: {
          coach_id: string
          coach_note: string
          created_at: string
          decision: Database["public"]["Enums"]["coach_review_decision"]
          id: string
          submission_id: string
        }
        Insert: {
          coach_id: string
          coach_note: string
          created_at?: string
          decision: Database["public"]["Enums"]["coach_review_decision"]
          id?: string
          submission_id: string
        }
        Update: {
          coach_id?: string
          coach_note?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["coach_review_decision"]
          id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "coaching_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_exercises: {
        Row: {
          artefact_type: string
          created_at: string
          framework_capability_id: string
          id: string
          instructions: string
          key: string
          programme_id: string
          sort_order: number
          title: string
        }
        Insert: {
          artefact_type: string
          created_at?: string
          framework_capability_id: string
          id?: string
          instructions: string
          key: string
          programme_id: string
          sort_order?: number
          title: string
        }
        Update: {
          artefact_type?: string
          created_at?: string
          framework_capability_id?: string
          id?: string
          instructions?: string
          key?: string
          programme_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_exercises_framework_capability_id_fkey"
            columns: ["framework_capability_id"]
            isOneToOne: false
            referencedRelation: "framework_capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_exercises_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "coaching_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_programmes: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          framework_id: string
          id: string
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          framework_id: string
          id?: string
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          framework_id?: string
          id?: string
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_programmes_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "capability_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_submissions: {
        Row: {
          artefact_version_id: string
          attempt: number
          content_hash: string
          exercise_id: string
          external_url: string | null
          id: string
          intake_method: Database["public"]["Enums"]["coaching_intake_method"]
          owner_id: string
          reviewed_at: string | null
          self_confidence: number | null
          state: Database["public"]["Enums"]["coaching_submission_state"]
          storage_path: string | null
          submitted_at: string
        }
        Insert: {
          artefact_version_id: string
          attempt: number
          content_hash: string
          exercise_id: string
          external_url?: string | null
          id?: string
          intake_method: Database["public"]["Enums"]["coaching_intake_method"]
          owner_id: string
          reviewed_at?: string | null
          self_confidence?: number | null
          state?: Database["public"]["Enums"]["coaching_submission_state"]
          storage_path?: string | null
          submitted_at?: string
        }
        Update: {
          artefact_version_id?: string
          attempt?: number
          content_hash?: string
          exercise_id?: string
          external_url?: string | null
          id?: string
          intake_method?: Database["public"]["Enums"]["coaching_intake_method"]
          owner_id?: string
          reviewed_at?: string | null
          self_confidence?: number | null
          state?: Database["public"]["Enums"]["coaching_submission_state"]
          storage_path?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_submissions_artefact_version_id_fkey"
            columns: ["artefact_version_id"]
            isOneToOne: true
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "coaching_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          attestation_id: string
          credential_json: Json
          id: string
          issued_at: string
          owner_id: string
          revoked_at: string | null
          status: string
        }
        Insert: {
          attestation_id: string
          credential_json: Json
          id?: string
          issued_at?: string
          owner_id: string
          revoked_at?: string | null
          status?: string
        }
        Update: {
          attestation_id?: string
          credential_json?: Json
          id?: string
          issued_at?: string
          owner_id?: string
          revoked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_attestation_id_fkey"
            columns: ["attestation_id"]
            isOneToOne: false
            referencedRelation: "attestations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cards: {
        Row: {
          created_at: string
          id: string
          key: string
          required_artefact: string
          tests: string
          title: string
          trigger_description: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          required_artefact: string
          tests: string
          title: string
          trigger_description: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          required_artefact?: string
          tests?: string
          title?: string
          trigger_description?: string
        }
        Relationships: []
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
      experience_enrolments: {
        Row: {
          completed_at: string | null
          id: string
          owner_id: string
          scenario_id: string
          started_at: string
          state: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          owner_id: string
          scenario_id: string
          started_at?: string
          state?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          owner_id?: string
          scenario_id?: string
          started_at?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_enrolments_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "experience_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_scenarios: {
        Row: {
          company_mark: string
          company_name: string
          company_stage: string
          created_at: string
          duration_label: string
          enabled: boolean
          entry_level: string | null
          framework_id: string
          framework_version: string
          id: string
          key: string
          name: string
          role_title: string
          sector: string | null
          signature_dilemma: string | null
          summary: string
        }
        Insert: {
          company_mark: string
          company_name: string
          company_stage: string
          created_at?: string
          duration_label: string
          enabled?: boolean
          entry_level?: string | null
          framework_id: string
          framework_version?: string
          id?: string
          key: string
          name: string
          role_title: string
          sector?: string | null
          signature_dilemma?: string | null
          summary: string
        }
        Update: {
          company_mark?: string
          company_name?: string
          company_stage?: string
          created_at?: string
          duration_label?: string
          enabled?: boolean
          entry_level?: string | null
          framework_id?: string
          framework_version?: string
          id?: string
          key?: string
          name?: string
          role_title?: string
          sector?: string | null
          signature_dilemma?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_scenarios_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "capability_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_submissions: {
        Row: {
          artefact_version_id: string
          enrolment_id: string
          id: string
          owner_id: string
          sections_completed: number
          submitted_at: string
          task_id: string
          word_count: number
        }
        Insert: {
          artefact_version_id: string
          enrolment_id: string
          id?: string
          owner_id: string
          sections_completed: number
          submitted_at?: string
          task_id: string
          word_count: number
        }
        Update: {
          artefact_version_id?: string
          enrolment_id?: string
          id?: string
          owner_id?: string
          sections_completed?: number
          submitted_at?: string
          task_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_submissions_artefact_version_id_fkey"
            columns: ["artefact_version_id"]
            isOneToOne: false
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_submissions_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "experience_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "experience_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_task_drafts: {
        Row: {
          body: string
          owner_id: string
          sections: Json
          task_id: string
          updated_at: string
        }
        Insert: {
          body?: string
          owner_id: string
          sections?: Json
          task_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          owner_id?: string
          sections?: Json
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_task_drafts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "experience_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_tasks: {
        Row: {
          brief: string
          capability_key: string
          context: string
          created_at: string
          guidance: Json
          id: string
          key: string
          min_words: number
          phase_label: string
          scenario_id: string
          sections: Json
          sort_order: number
          stakeholders: Json
          title: string
          week: number
        }
        Insert: {
          brief: string
          capability_key: string
          context: string
          created_at?: string
          guidance?: Json
          id?: string
          key: string
          min_words?: number
          phase_label: string
          scenario_id: string
          sections?: Json
          sort_order: number
          stakeholders?: Json
          title: string
          week: number
        }
        Update: {
          brief?: string
          capability_key?: string
          context?: string
          created_at?: string
          guidance?: Json
          id?: string
          key?: string
          min_words?: number
          phase_label?: string
          scenario_id?: string
          sections?: Json
          sort_order?: number
          stakeholders?: Json
          title?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_tasks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "experience_scenarios"
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
      interview_answers: {
        Row: {
          artefact_version_id: string | null
          body: string
          checksum: string | null
          created_at: string
          id: string
          owner_id: string
          question_id: string
          self_rating: number | null
          signal_level: string
          updated_at: string
        }
        Insert: {
          artefact_version_id?: string | null
          body: string
          checksum?: string | null
          created_at?: string
          id?: string
          owner_id: string
          question_id: string
          self_rating?: number | null
          signal_level?: string
          updated_at?: string
        }
        Update: {
          artefact_version_id?: string | null
          body?: string
          checksum?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          question_id?: string
          self_rating?: number | null
          signal_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_artefact_version_id_fkey"
            columns: ["artefact_version_id"]
            isOneToOne: false
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          rationale: string
          reviewer_id: string | null
          rubric_dimension: string
          score: number
          session_id: string
          signal_level: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          rationale: string
          reviewer_id?: string | null
          rubric_dimension: string
          score: number
          session_id: string
          signal_level?: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          rationale?: string
          reviewer_id?: string | null
          rubric_dimension?: string
          score?: number
          session_id?: string
          signal_level?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          capability_key: string | null
          created_at: string
          depth: number
          id: string
          origin: string
          owner_id: string
          parent_question_id: string | null
          prompt: string
          question_type: string
          session_id: string
          signal_level: string
          sort_order: number
          source_evidence_id: string | null
        }
        Insert: {
          capability_key?: string | null
          created_at?: string
          depth?: number
          id?: string
          origin: string
          owner_id: string
          parent_question_id?: string | null
          prompt: string
          question_type?: string
          session_id: string
          signal_level?: string
          sort_order?: number
          source_evidence_id?: string | null
        }
        Update: {
          capability_key?: string | null
          created_at?: string
          depth?: number
          id?: string
          origin?: string
          owner_id?: string
          parent_question_id?: string | null
          prompt?: string
          question_type?: string
          session_id?: string
          signal_level?: string
          sort_order?: number
          source_evidence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_parent_question_id_fkey"
            columns: ["parent_question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_source_evidence_id_fkey"
            columns: ["source_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          focus_capability_key: string | null
          id: string
          owner_id: string
          role_target: string
          signal_level: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_capability_key?: string | null
          id?: string
          owner_id: string
          role_target: string
          signal_level?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_capability_key?: string | null
          id?: string
          owner_id?: string
          role_target?: string
          signal_level?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      job_applications: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          id: string
          next_step: string
          next_step_at: string | null
          notes: string
          owner_id: string
          portfolio_share_id: string | null
          role_title: string
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          id?: string
          next_step?: string
          next_step_at?: string | null
          notes?: string
          owner_id: string
          portfolio_share_id?: string | null
          role_title: string
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          id?: string
          next_step?: string
          next_step_at?: string | null
          notes?: string
          owner_id?: string
          portfolio_share_id?: string | null
          role_title?: string
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_portfolio_share_id_fkey"
            columns: ["portfolio_share_id"]
            isOneToOne: false
            referencedRelation: "portfolio_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_events: {
        Row: {
          detail: Json
          environment: string
          fingerprint: string | null
          id: string
          kind: string
          message: string
          occurred_at: string
          route: string | null
          severity: string
          source: string
          user_id: string | null
        }
        Insert: {
          detail?: Json
          environment?: string
          fingerprint?: string | null
          id?: string
          kind: string
          message: string
          occurred_at?: string
          route?: string | null
          severity: string
          source: string
          user_id?: string | null
        }
        Update: {
          detail?: Json
          environment?: string
          fingerprint?: string | null
          id?: string
          kind?: string
          message?: string
          occurred_at?: string
          route?: string | null
          severity?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
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
      performance_reviews: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          period_label: string
          reviewed_at: string | null
          reviewer_decision: string | null
          reviewer_id: string | null
          reviewer_summary: string | null
          self_summary: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          period_label: string
          reviewed_at?: string | null
          reviewer_decision?: string | null
          reviewer_id?: string | null
          reviewer_summary?: string | null
          self_summary: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          period_label?: string
          reviewed_at?: string | null
          reviewer_decision?: string | null
          reviewer_id?: string | null
          reviewer_summary?: string | null
          self_summary?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pi_onboarding_state: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_step: number
          owner_id: string
          skipped_steps: number[]
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          owner_id: string
          skipped_steps?: number[]
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          owner_id?: string
          skipped_steps?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          include_self_reported: boolean
          label: string
          owner_id: string
          revoked_at: string | null
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          include_self_reported?: boolean
          label: string
          owner_id: string
          revoked_at?: string | null
          token?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          include_self_reported?: boolean
          label?: string
          owner_id?: string
          revoked_at?: string | null
          token?: string
          view_count?: number
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
      scenario_event_cards: {
        Row: {
          event_card_id: string
          scenario_id: string
        }
        Insert: {
          event_card_id: string
          scenario_id: string
        }
        Update: {
          event_card_id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_event_cards_event_card_id_fkey"
            columns: ["event_card_id"]
            isOneToOne: false
            referencedRelation: "event_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_event_cards_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "experience_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_phases: {
        Row: {
          artefact_type: string
          brief: string
          created_at: string
          id: string
          phase_number: number
          rubric_dimensions: string[]
          scenario_id: string
          title: string
          unlock_after: number | null
        }
        Insert: {
          artefact_type: string
          brief: string
          created_at?: string
          id?: string
          phase_number: number
          rubric_dimensions?: string[]
          scenario_id: string
          title: string
          unlock_after?: number | null
        }
        Update: {
          artefact_type?: string
          brief?: string
          created_at?: string
          id?: string
          phase_number?: number
          rubric_dimensions?: string[]
          scenario_id?: string
          title?: string
          unlock_after?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_phases_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "experience_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_stakeholders: {
        Row: {
          created_at: string
          id: string
          name: string
          scenario_id: string
          sort_order: number
          starting_trust: string
          wants: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scenario_id: string
          sort_order?: number
          starting_trust: string
          wants: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scenario_id?: string
          sort_order?: number
          starting_trust?: string
          wants?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_stakeholders_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "experience_scenarios"
            referencedColumns: ["id"]
          },
        ]
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
      self_report_claims: {
        Row: {
          captured_at: string
          claim_key: string
          claim_kind: string
          claim_value: string
          created_at: string
          framework_capability_key: string | null
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          captured_at?: string
          claim_key: string
          claim_kind: string
          claim_value: string
          created_at?: string
          framework_capability_key?: string | null
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          captured_at?: string
          claim_key?: string
          claim_kind?: string
          claim_value?: string
          created_at?: string
          framework_capability_key?: string | null
          id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_event_draws: {
        Row: {
          drawn_at: string
          enrolment_id: string
          event_card_id: string
          id: string
          owner_id: string
          status: string
        }
        Insert: {
          drawn_at?: string
          enrolment_id: string
          event_card_id: string
          id?: string
          owner_id: string
          status?: string
        }
        Update: {
          drawn_at?: string
          enrolment_id?: string
          event_card_id?: string
          id?: string
          owner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_draws_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "experience_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_event_draws_event_card_id_fkey"
            columns: ["event_card_id"]
            isOneToOne: false
            referencedRelation: "event_cards"
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
      workspace_ai_suggestions: {
        Row: {
          approved_content: Json | null
          content: Json
          created_at: string
          error_message: string | null
          id: string
          kind: string
          owner_id: string
          project_id: string
          resolved_at: string | null
          status: string
          target_id: string | null
          title: string
        }
        Insert: {
          approved_content?: Json | null
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          kind: string
          owner_id: string
          project_id: string
          resolved_at?: string | null
          status?: string
          target_id?: string | null
          title: string
        }
        Update: {
          approved_content?: Json | null
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          kind?: string
          owner_id?: string
          project_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ai_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_contribution_events: {
        Row: {
          detail: Json
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          occurred_at: string
          owner_id: string
          project_id: string
        }
        Insert: {
          detail?: Json
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          occurred_at?: string
          owner_id: string
          project_id: string
        }
        Update: {
          detail?: Json
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          occurred_at?: string
          owner_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_contribution_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_decisions: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          options: Json
          owner_id: string
          project_id: string
          rationale: string
          selected_option: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          options?: Json
          owner_id: string
          project_id: string
          rationale?: string
          selected_option?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          options?: Json
          owner_id?: string
          project_id?: string
          rationale?: string
          selected_option?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_decisions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_documents: {
        Row: {
          body: string
          content_hash: string | null
          created_at: string
          id: string
          kind: string
          owner_id: string
          project_id: string
          status: string
          submitted_version_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          kind?: string
          owner_id: string
          project_id: string
          status?: string
          submitted_version_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          kind?: string
          owner_id?: string
          project_id?: string
          status?: string
          submitted_version_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_documents_submitted_version_id_fkey"
            columns: ["submitted_version_id"]
            isOneToOne: false
            referencedRelation: "artefact_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_meetings: {
        Row: {
          agenda: string
          created_at: string
          id: string
          notes: string
          owner_id: string
          project_id: string
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string
          created_at?: string
          id?: string
          notes?: string
          owner_id: string
          project_id: string
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          id?: string
          notes?: string
          owner_id?: string
          project_id?: string
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_observation_preferences: {
        Row: {
          changed_at: string
          enabled: boolean
          owner_id: string
          project_id: string
        }
        Insert: {
          changed_at?: string
          enabled?: boolean
          owner_id: string
          project_id: string
        }
        Update: {
          changed_at?: string
          enabled?: boolean
          owner_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_observation_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_people: {
        Row: {
          accent: string
          created_at: string
          id: string
          kind: string
          memory: Json
          name: string
          owner_id: string
          project_id: string
          remit: string
          role: string
        }
        Insert: {
          accent?: string
          created_at?: string
          id?: string
          kind: string
          memory?: Json
          name: string
          owner_id: string
          project_id: string
          remit: string
          role: string
        }
        Update: {
          accent?: string
          created_at?: string
          id?: string
          kind?: string
          memory?: Json
          name?: string
          owner_id?: string
          project_id?: string
          remit?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_people_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_projects: {
        Row: {
          context: Json
          created_at: string
          experience_enrolment_id: string | null
          id: string
          owner_id: string
          purpose: string
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          context?: Json
          created_at?: string
          experience_enrolment_id?: string | null
          id?: string
          owner_id: string
          purpose: string
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          context?: Json
          created_at?: string
          experience_enrolment_id?: string | null
          id?: string
          owner_id?: string
          purpose?: string
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_projects_experience_enrolment_id_fkey"
            columns: ["experience_enrolment_id"]
            isOneToOne: false
            referencedRelation: "experience_enrolments"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_risks: {
        Row: {
          created_at: string
          detail: string
          id: string
          impact: string
          mitigation: string
          owner_id: string
          probability: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          impact?: string
          mitigation?: string
          owner_id: string
          probability?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          impact?: string
          mitigation?: string
          owner_id?: string
          probability?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          detail: string
          due_at: string | null
          id: string
          owner_id: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          detail?: string
          due_at?: string | null
          id?: string
          owner_id: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          detail?: string
          due_at?: string | null
          id?: string
          owner_id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "workspace_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "workspace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_coaching_submission: {
        Args: {
          _body: string
          _content_hash?: string
          _exercise_id: string
          _external_url?: string
          _intake_method: Database["public"]["Enums"]["coaching_intake_method"]
          _self_confidence?: number
          _storage_path?: string
          _title: string
        }
        Returns: string
      }
      has_plan_access: {
        Args: {
          requested_environment?: string
          requested_product: string
          requested_user_id: string
        }
        Returns: boolean
      }
      record_workspace_contribution: {
        Args: {
          _detail?: Json
          _entity_id?: string
          _entity_type: string
          _event_type: string
          _project_id: string
        }
        Returns: string
      }
      review_coaching_submission: {
        Args: {
          _coach_note: string
          _decision: Database["public"]["Enums"]["coach_review_decision"]
          _submission_id: string
        }
        Returns: string
      }
      review_performance_review: {
        Args: { _decision: string; _review_id: string; _summary: string }
        Returns: string
      }
      submit_workspace_document: {
        Args: { _document_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attestation_state: "pending" | "confirmed" | "declined" | "disputed"
      attestation_status:
        | "unattested"
        | "attestation_requested"
        | "externally_attested"
        | "disputed"
      coach_review_decision: "confirmed" | "rejected"
      coaching_intake_method:
        | "structured_response"
        | "file_upload"
        | "external_link"
      coaching_submission_state:
        | "pending"
        | "confirmed"
        | "rejected"
        | "superseded"
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
      coach_review_decision: ["confirmed", "rejected"],
      coaching_intake_method: [
        "structured_response",
        "file_upload",
        "external_link",
      ],
      coaching_submission_state: [
        "pending",
        "confirmed",
        "rejected",
        "superseded",
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

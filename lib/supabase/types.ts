export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      survey_questions: {
        Row: {
          id: string;
          survey_id: string;
          prompt: string;
          question_type: "객관식" | "주관식";
          options: Json | null;
          conditional_logic: Json | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          prompt: string;
          question_type: "객관식" | "주관식";
          options?: Json | null;
          conditional_logic?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          prompt?: string;
          question_type?: "객관식" | "주관식";
          options?: Json | null;
          conditional_logic?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      survey_responses: {
        Row: {
          id: string;
          survey_id: string;
          employee_id: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          employee_id: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          employee_id?: string;
          submitted_at?: string;
        };
      };
      survey_answers: {
        Row: {
          id: string;
          response_id: string;
          question_id: string;
          answer_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          question_id: string;
          answer_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          question_id?: string;
          answer_text?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          password: string;
          role: "직원" | "관리자" | "마스터";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          password: string;
          role: "직원" | "관리자" | "마스터";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          password?: string;
          role?: "직원" | "관리자" | "마스터";
          created_at?: string;
          updated_at?: string;
        };
      };
      verification_codes: {
        Row: {
          role: "직원" | "관리자" | "마스터";
          code: string;
          updated_at: string;
        };
        Insert: {
          role: "직원" | "관리자" | "마스터";
          code: string;
          updated_at?: string;
        };
        Update: {
          role?: "직원" | "관리자" | "마스터";
          code?: string;
          updated_at?: string;
        };
      };
      question_templates: {
        Row: {
          id: string;
          name: string;
          question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
          options: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
          options: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          question_type?: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
          options?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_recipients: {
        Row: {
          id: string;
          survey_id: string;
          name: string;
          email: string;
          email_sent: boolean;
          email_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          name: string;
          email: string;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          name?: string;
          email?: string;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: Record<string, never>;
  };
};


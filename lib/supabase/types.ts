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
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          prompt: string;
          question_type: "객관식" | "주관식";
          options?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          prompt?: string;
          question_type?: "객관식" | "주관식";
          options?: Json | null;
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
    };
    Functions: Record<string, never>;
  };
};


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProblemStatus = 'open' | 'in_progress' | 'solved' | 'archived';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          skills: string[] | null;
          interests: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      problems: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string | null;
          keywords: string[] | null;
          urgency: string | null;
          target_users: string[] | null;
          status: ProblemStatus;
          report_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category?: string | null;
          keywords?: string[] | null;
          urgency?: string | null;
          target_users?: string[] | null;
          status?: ProblemStatus;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string | null;
          keywords?: string[] | null;
          urgency?: string | null;
          target_users?: string[] | null;
          status?: ProblemStatus;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          problem_id: string;
          user_id: string | null;
          original_text: string;
          sub_problem: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          user_id?: string | null;
          original_text: string;
          sub_problem?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          user_id?: string | null;
          original_text?: string;
          sub_problem?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      solutions: {
        Row: {
          id: string;
          problem_id: string;
          user_id: string;
          title: string;
          description: string;
          github_url: string | null;
          demo_url: string | null;
          live_url: string | null;
          video_url: string | null;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          user_id: string;
          title: string;
          description: string;
          github_url?: string | null;
          demo_url?: string | null;
          live_url?: string | null;
          video_url?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          github_url?: string | null;
          demo_url?: string | null;
          live_url?: string | null;
          video_url?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solutions_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solutions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      solution_likes: {
        Row: {
          id: string;
          solution_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          solution_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          solution_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solution_likes_solution_id_fkey";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solution_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

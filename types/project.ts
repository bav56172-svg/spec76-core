export interface Project {
  id: string;

  company_id: string;

  owner_id: string;

  title: string;

  description: string;

  status: "draft" | "active" | "completed" | "archived";

  created_at: string;

  updated_at: string;
}
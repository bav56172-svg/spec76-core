import type { EntityId, IsoDateTime } from "./common";

export type DocumentType =
  | "contract"
  | "estimate"
  | "act"
  | "invoice"
  | "photo"
  | "technical"
  | "other";

export type DocumentStatus = "draft" | "active" | "archived";

export interface ProjectDocument {
  id: EntityId;
  project_id: EntityId;
  task_id: EntityId | null;
  owner_id: EntityId;
  document_type: DocumentType;
  title: string;
  description: string | null;
  status: DocumentStatus;
  current_version: number;
  archived_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface DocumentVersion {
  id: EntityId;
  document_id: EntityId;
  version_number: number;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  uploaded_by: EntityId;
  created_at: IsoDateTime;
}

export type CreateDocumentInput = Pick<
  ProjectDocument,
  "project_id" | "document_type" | "title"
> &
  Partial<Pick<ProjectDocument, "task_id" | "description">>;

export type CreateDocumentVersionInput = Pick<
  DocumentVersion,
  "document_id" | "storage_path" | "file_name"
> &
  Partial<Pick<DocumentVersion, "mime_type" | "size_bytes" | "checksum">>;

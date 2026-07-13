import { supabase } from "@/services/supabase";
import type {
  CreateDocumentInput,
  CreateDocumentVersionInput,
  DocumentVersion,
  ProjectDocument,
} from "@/types/document";

export async function listProjectDocuments(projectId: string) {
  return await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectDocument[]>();
}

export async function getDocument(documentId: string) {
  return await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single<ProjectDocument>();
}

export async function listDocumentVersions(documentId: string) {
  return await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .returns<DocumentVersion[]>();
}

export async function createDocument(input: CreateDocumentInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      data: null,
      error: authError ?? new Error("Пользователь не авторизован."),
    };
  }

  return await supabase
    .from("documents")
    .insert({
      project_id: input.project_id,
      task_id: input.task_id ?? null,
      owner_id: authData.user.id,
      document_type: input.document_type,
      title: input.title.trim(),
      description: input.description?.trim() || null,
    })
    .select("*")
    .single<ProjectDocument>();
}

export async function createDocumentVersion(input: CreateDocumentVersionInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      data: null,
      error: authError ?? new Error("Пользователь не авторизован."),
    };
  }

  return await supabase.rpc("create_document_version", {
    p_document_id: input.document_id,
    p_storage_path: input.storage_path,
    p_file_name: input.file_name,
    p_mime_type: input.mime_type ?? null,
    p_size_bytes: input.size_bytes ?? null,
    p_checksum: input.checksum ?? null,
  });
}

export async function archiveDocument(documentId: string) {
  return await supabase
    .from("documents")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();
}

export async function restoreDocument(documentId: string) {
  return await supabase
    .from("documents")
    .update({ status: "active", archived_at: null })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();
}

import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type {
  CreateDocumentInput,
  CreateDocumentVersionInput,
  DocumentVersion,
  ProjectDocument,
} from "@/types/document";
import type { ServiceResult } from "@/types/service-result";

export async function listProjectDocuments(
  projectId: string,
): Promise<ServiceResult<ProjectDocument[]>> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectDocument[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить документы.");
  }

  return serviceSuccess(data ?? []);
}

export async function getDocument(
  documentId: string,
): Promise<ServiceResult<ProjectDocument>> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single<ProjectDocument>();

  if (error) {
    return databaseFailure(error, "Не удалось получить документ.");
  }

  return serviceSuccess(data);
}

export async function listDocumentVersions(
  documentId: string,
): Promise<ServiceResult<DocumentVersion[]>> {
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .returns<DocumentVersion[]>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить версии документа.",
    );
  }

  return serviceSuccess(data ?? []);
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<ServiceResult<ProjectDocument>> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(
      authError,
      "Не удалось проверить пользователя.",
    );
  }

  if (!authData.user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Пользователь не авторизован.",
    );
  }

  const { data, error } = await supabase
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

  if (error) {
    return databaseFailure(error, "Не удалось создать документ.");
  }

  return serviceSuccess(data);
}

export async function createDocumentVersion(
  input: CreateDocumentVersionInput,
): Promise<ServiceResult<unknown>> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    return databaseFailure(
      authError,
      "Не удалось проверить пользователя.",
    );
  }

  if (!authData.user) {
    return serviceFailure(
      "AUTH_REQUIRED",
      "Пользователь не авторизован.",
    );
  }

  const { data, error } = await supabase.rpc(
    "create_document_version",
    {
      p_document_id: input.document_id,
      p_storage_path: input.storage_path,
      p_file_name: input.file_name,
      p_mime_type: input.mime_type ?? null,
      p_size_bytes: input.size_bytes ?? null,
      p_checksum: input.checksum ?? null,
    },
  );

  if (error) {
    return databaseFailure(
      error,
      "Не удалось создать версию документа.",
    );
  }

  return serviceSuccess(data);
}

export async function archiveDocument(
  documentId: string,
): Promise<ServiceResult<ProjectDocument>> {
  const { data, error } = await supabase
    .from("documents")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось архивировать документ.",
    );
  }

  return serviceSuccess(data);
}

export async function restoreDocument(
  documentId: string,
): Promise<ServiceResult<ProjectDocument>> {
  const { data, error } = await supabase
    .from("documents")
    .update({
      status: "active",
      archived_at: null,
    })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось восстановить документ.",
    );
  }

  return serviceSuccess(data);
}

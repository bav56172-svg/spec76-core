"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  archiveDocument,
  createDocument,
  listProjectDocuments,
  restoreDocument,
} from "@/services/documents";
import type {
  DocumentStatus,
  DocumentType,
  ProjectDocument,
} from "@/types/document";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  contract: "Договор",
  estimate: "Смета",
  act: "Акт",
  invoice: "Счёт",
  photo: "Фотография",
  technical: "Технический документ",
  other: "Другое",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Черновик",
  active: "Активен",
  archived: "В архиве",
};

export default function ProjectDocumentsPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listProjectDocuments(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setDocuments([]);
      } else {
        setDocuments(data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const activeCount = useMemo(
    () => documents.filter((document) => document.status !== "archived").length,
    [documents],
  );

  async function handleCreate() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createDocument({
      project_id: projectId,
      document_type: documentType,
      title: normalizedTitle,
      description,
    });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать документ.");
    } else {
      setDocuments((current) => [data, ...current]);
      setTitle("");
      setDescription("");
      setDocumentType("other");
    }

    setSaving(false);
  }

  async function toggleArchive(document: ProjectDocument) {
    const action = document.status === "archived" ? restoreDocument : archiveDocument;
    const { data, error: updateError } = await action(document.id);

    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось изменить статус документа.");
      return;
    }

    setDocuments((current) =>
      current.map((item) => (item.id === data.id ? data : item)),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <Link href={`/projects/${projectId}`} className="text-sm text-sky-300 hover:underline">
            ← К рабочему пространству проекта
          </Link>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-sky-300">
            Documents Engine (движок документов)
          </p>
          <h1 className="mt-2 text-3xl font-bold">Документы проекта</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Единый реестр документов, их статусов и версий. На первом этапе сохраняются метаданные; загрузка файлов в Storage (файловое хранилище) подключается отдельной операцией.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Всего документов</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{documents.length}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Активных</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{activeCount}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Версий файлов</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {documents.reduce((sum, document) => sum + document.current_version, 0)}
            </p>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Создать документ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Metadata (метаданные) описывают документ независимо от конкретного файла.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Название
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, Договор на выполнение работ"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Тип документа
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value as DocumentType)}
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Описание
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Краткое назначение документа"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !title.trim()}
            className="mt-4 rounded-lg bg-slate-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Создать документ"}
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Реестр документов</h2>

          {loading ? (
            <p className="mt-5 text-slate-600">Загрузка документов...</p>
          ) : documents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">Документов пока нет</p>
              <p className="mt-2 text-sm text-slate-600">Создай первую карточку документа выше.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {documents.map((document) => (
                <article key={document.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        {DOCUMENT_TYPE_LABELS[document.document_type]}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{document.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {STATUS_LABELS[document.status]}
                    </span>
                  </div>

                  {document.description && (
                    <p className="mt-3 text-sm text-slate-600">{document.description}</p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Текущая версия</dt>
                      <dd className="font-medium text-slate-900">{document.current_version || "Нет файла"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Создан</dt>
                      <dd className="font-medium text-slate-900">
                        {new Date(document.created_at).toLocaleDateString("ru-RU")}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => void toggleArchive(document)}
                    className="mt-4 text-sm font-medium text-blue-700 hover:underline"
                  >
                    {document.status === "archived" ? "Восстановить" : "Переместить в архив"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

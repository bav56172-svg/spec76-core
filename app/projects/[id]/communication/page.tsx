"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createProjectConversation,
  listProjectConversations,
} from "@/services/conversations";
import {
  listConversationMessages,
  sendConversationMessage,
} from "@/services/messages";
import type { Conversation } from "@/types/conversation";
import type { ProjectMessage } from "@/types/message";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export default function ProjectCommunicationPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [conversationTitle, setConversationTitle] = useState("Общий диалог проекта");
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listProjectConversations(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setConversations([]);
      } else {
        const loaded = data ?? [];
        setConversations(loaded);
        setSelectedConversationId(loaded[0]?.id ?? null);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    let active = true;

    void listConversationMessages(selectedConversationId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setMessages([]);
      } else {
        setMessages(data ?? []);
        setError(null);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  async function handleCreateConversation() {
    const title = conversationTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createProjectConversation({
      project_id: projectId,
      title,
      conversation_type: "general",
    });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать диалог.");
    } else {
      setConversations((current) => [data, ...current]);
      setSelectedConversationId(data.id);
      setConversationTitle("");
      setMessages([]);
    }

    setSaving(false);
  }

  async function handleSendMessage() {
    const body = messageBody.trim();
    if (!selectedConversationId || !body || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: sendError } = await sendConversationMessage({
      conversation_id: selectedConversationId,
      body,
    });

    if (sendError || !data) {
      setError(sendError?.message ?? "Не удалось отправить сообщение.");
    } else {
      setMessages((current) => [...current, data]);
      setMessageBody("");
    }

    setSaving(false);
  }

  if (loading) {
    return <main className="p-8">Загрузка коммуникаций проекта...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
            Project Communication Platform (платформа коммуникаций проекта)
          </p>
          <h1 className="mt-2 text-3xl font-bold">Диалоги проекта</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Общение участников, история сообщений и будущая связь с задачами, документами и этапами.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Conversation (диалог)</h2>
              <p className="mt-1 text-sm text-slate-600">Создай общий или тематический диалог.</p>
            </div>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={conversationTitle}
              onChange={(event) => setConversationTitle(event.target.value)}
              placeholder="Название диалога"
            />
            <button
              type="button"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
              disabled={saving || !conversationTitle.trim()}
              onClick={() => void handleCreateConversation()}
            >
              Создать диалог
            </button>

            <div className="space-y-2 border-t border-slate-200 pt-4">
              {conversations.length === 0 ? (
                <p className="text-sm text-slate-500">Диалогов пока нет.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedConversationId === conversation.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <span className="block font-medium text-slate-900">{conversation.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col rounded-2xl bg-white p-5 shadow-sm">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-semibold text-slate-900">{selectedConversation.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Thread (ветка обсуждения) — последовательность сообщений внутри диалога.
                  </p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto py-5">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">Сообщений пока нет. Начни обсуждение.</p>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="whitespace-pre-wrap text-slate-800">{message.body}</p>
                        <p className="mt-2 text-xs text-slate-400">{formatDate(message.created_at)}</p>
                      </article>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Напиши сообщение участникам проекта"
                  />
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-sky-700 px-5 py-2 font-medium text-white disabled:opacity-50"
                    disabled={saving || !messageBody.trim()}
                    onClick={() => void handleSendMessage()}
                  >
                    Отправить сообщение
                  </button>
                </div>
              </>
            ) : (
              <div className="m-auto max-w-md text-center">
                <h2 className="text-xl font-semibold text-slate-900">Создай первый диалог</h2>
                <p className="mt-2 text-sm text-slate-600">
                  После создания здесь появится история сообщений проекта.
                </p>
              </div>
            )}
          </section>
        </section>

        <Link href={`/projects/${projectId}`} className="inline-block text-blue-700 hover:underline">
          ← Вернуться в рабочее пространство проекта
        </Link>
      </div>
    </main>
  );
}

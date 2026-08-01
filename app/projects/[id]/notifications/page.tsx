"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listProjectNotifications,
  markAllProjectNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notifications";
import type { Notification } from "@/types/notification";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export default function ProjectNotificationsPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listProjectNotifications(projectId).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status === "unread").length,
    [notifications],
  );

  async function handleMarkAsRead(notification: Notification) {
    if (notification.status !== "unread") return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, status: "read", read_at: new Date().toISOString() }
          : item,
      ),
    );

    const { error: updateError } = await markNotificationAsRead(notification.id);
    if (updateError) {
      setNotifications(previous);
      setError(updateError.message);
    }
  }

  async function handleMarkAllAsRead() {
    if (saving || unreadCount === 0) return;

    setSaving(true);
    setError(null);

    const previous = notifications;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) =>
        item.status === "unread" ? { ...item, status: "read", read_at: readAt } : item,
      ),
    );

    const { error: updateError } = await markAllProjectNotificationsAsRead(projectId);
    if (updateError) {
      setNotifications(previous);
      setError(updateError.message);
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
            Notifications Engine (движок уведомлений)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Уведомления проекта</h1>
              <p className="mt-2 text-slate-300">
                Важные события проекта, адресованные текущему пользователю.
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              Непрочитано: {unreadCount}
            </span>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/projects/${projectId}`} className="text-blue-700 hover:underline">
            ← Вернуться в рабочее пространство
          </Link>
          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            disabled={saving || unreadCount === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Отметить все прочитанными"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p>Загрузка уведомлений...</p>
        ) : notifications.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Уведомлений пока нет</h2>
            <p className="mt-2 text-slate-600">
              Они появятся после новых действий участников проекта.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleMarkAsRead(notification)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
                  notification.status === "unread"
                    ? "border-sky-200 bg-sky-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                    {notification.message && (
                      <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {notification.status === "unread" ? "Новое" : "Прочитано"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {notification.event_type} · {formatDate(notification.created_at)}
                </p>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

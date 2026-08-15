"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  completeMilestone,
  createMilestone,
  createTimeline,
  listProjectMilestones,
  listProjectTimelines,
  updateTimeline,
} from "@/services/timeline";
import type { ProjectMilestone, ProjectTimeline } from "@/types/timeline";

export default function ProjectTimelinePage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [timelines, setTimelines] = useState<ProjectTimeline[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      listProjectTimelines(projectId),
      listProjectMilestones(projectId),
    ]).then(([timelineResult, milestoneResult]) => {
      if (!active) return;

      const loadError = timelineResult.error ?? milestoneResult.error;
      if (loadError) {
        setError(loadError.message);
      } else {
        setTimelines(timelineResult.data ?? []);
        setMilestones(milestoneResult.data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const overallProgress = useMemo(() => {
    if (timelines.length === 0) return 0;
    return Math.round(
      timelines.reduce((sum, item) => sum + item.progress, 0) / timelines.length,
    );
  }, [timelines]);

  async function handleCreateTimeline() {
    const title = timelineTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    const { data, error: createError } = await createTimeline({ project_id: projectId, title });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать этап.");
    } else {
      setTimelines((current) => [...current, data]);
      setTimelineTitle("");
    }
    setSaving(false);
  }

  async function handleCreateMilestone() {
    const title = milestoneTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    const { data, error: createError } = await createMilestone({ project_id: projectId, title });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать контрольный этап.");
    } else {
      setMilestones((current) => [...current, data]);
      setMilestoneTitle("");
    }
    setSaving(false);
  }

  async function handleProgress(item: ProjectTimeline, progress: number) {
    const status = progress === 100 ? "completed" : progress > 0 ? "active" : "planned";
    const { data, error: updateError } = await updateTimeline(item.id, { progress, status });
    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось обновить этап.");
      return;
    }
    setTimelines((current) => current.map((value) => (value.id === data.id ? data : value)));
  }

  async function handleCompleteMilestone(item: ProjectMilestone) {
    const { data, error: updateError } = await completeMilestone(item.id);
    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось завершить контрольный этап.");
      return;
    }
    setMilestones((current) => current.map((value) => (value.id === data.id ? data : value)));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white">
          <Link href={`/projects/${projectId}`} className="text-sm text-sky-300 hover:underline">
            ← К рабочему пространству проекта
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Timeline & Milestones (временная шкала и контрольные этапы)</h1>
          <p className="mt-2 text-slate-300">Общий прогресс проекта: {overallProgress}%</p>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Этапы временной шкалы</h2>
            <div className="mt-4 flex gap-3">
              <input
                className="w-full rounded-lg border p-3"
                value={timelineTitle}
                onChange={(event) => setTimelineTitle(event.target.value)}
                placeholder="Например: Подготовительные работы"
              />
              <button
                type="button"
                onClick={() => void handleCreateTimeline()}
                disabled={saving || !timelineTitle.trim()}
                className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p>Загрузка...</p>
              ) : timelines.length === 0 ? (
                <p className="text-slate-500">Этапы ещё не созданы.</p>
              ) : (
                timelines.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="text-sm text-slate-500">{item.progress}%</span>
                    </div>
                    <input
                      className="mt-4 w-full"
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={item.progress}
                      onChange={(event) => void handleProgress(item, Number(event.target.value))}
                    />
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Контрольные этапы</h2>
            <div className="mt-4 flex gap-3">
              <input
                className="w-full rounded-lg border p-3"
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
                placeholder="Например: Договор подписан"
              />
              <button
                type="button"
                onClick={() => void handleCreateMilestone()}
                disabled={saving || !milestoneTitle.trim()}
                className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p>Загрузка...</p>
              ) : milestones.length === 0 ? (
                <p className="text-slate-500">Контрольные этапы ещё не созданы.</p>
              ) : (
                milestones.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.status === "completed" ? "Достигнут" : "Запланирован"}
                      </p>
                    </div>
                    {item.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => void handleCompleteMilestone(item)}
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

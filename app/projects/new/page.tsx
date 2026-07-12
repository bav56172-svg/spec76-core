"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createRequest } from "@/services/requests";
import type { RequestUrgency } from "@/types/request";

const initialCity = "Ярославль";

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(initialCity);
  const [locationText, setLocationText] = useState("");
  const [urgency, setUrgency] = useState<RequestUrgency>("normal");
  const [desiredStartAt, setDesiredStartAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage("Кратко назовите задачу — минимум 3 символа.");
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage("Опишите задачу подробнее — минимум 10 символов.");
      return;
    }

    if (city.trim().length < 2) {
      setErrorMessage("Укажите город выполнения работ.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await createRequest({
      title,
      description,
      city,
      location_text: locationText,
      urgency,
      desired_start_at:
        urgency === "scheduled" && desiredStartAt
          ? new Date(desiredStartAt).toISOString()
          : null,
    });

    setSubmitting(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Не удалось создать заявку.");
      return;
    }

    router.push(`/requests/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Шаг 1 из 2
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Что необходимо сделать?
        </h1>
        <p className="mt-3 text-slate-600">
          Опишите проблему обычными словами. Знать модель техники или точное
          название услуги не требуется.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="font-medium text-slate-900">Краткое название</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
              placeholder="Например: Убрать снег возле склада"
              maxLength={160}
              required
            />
          </label>

          <label className="block">
            <span className="font-medium text-slate-900">Описание задачи</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-44 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
              placeholder="Укажите объём, особенности территории, желаемый результат и всё, что считаете важным."
              maxLength={5000}
              required
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium text-slate-900">Город</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                required
              />
            </label>

            <label className="block">
              <span className="font-medium text-slate-900">Адрес или ориентир</span>
              <input
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                placeholder="Можно указать позже"
              />
            </label>
          </div>

          <fieldset>
            <legend className="font-medium text-slate-900">Срочность</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["normal", "Обычная"],
                ["urgent", "Срочно"],
                ["scheduled", "К определённой дате"],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3"
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={value}
                    checked={urgency === value}
                    onChange={() => setUrgency(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {urgency === "scheduled" && (
            <label className="block">
              <span className="font-medium text-slate-900">Желаемая дата начала</span>
              <input
                type="datetime-local"
                value={desiredStartAt}
                onChange={(event) => setDesiredStartAt(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
                required
              />
            </label>
          )}
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Создаём заявку..." : "Создать черновик заявки"}
        </button>
      </form>
    </main>
  );
}

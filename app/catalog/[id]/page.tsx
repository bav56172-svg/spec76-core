"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { getPublicCatalogItem, type CatalogListing } from "@/services/catalog";
import { supabase } from "@/services/supabase";
import { EQUIPMENT_CATEGORY_LABELS } from "@/types/equipment-category";

// OP-034: Public Equipment Catalog Foundation (see ADR-028). Public page,
// same reasoning as app/catalog/page.tsx.

function photoUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("equipment-photos").getPublicUrl(path).data
    .publicUrl;
}

export default function CatalogItemPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<CatalogListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchItem() {
      const result = await getPublicCatalogItem(params.id);

      if (!active) return;

      if (result.error) {
        setErrorMessage(result.error.message);
        setLoading(false);
        return;
      }

      setItem(result.data);
      setLoading(false);
    }

    void fetchItem();

    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" translate="no">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950">
              76
            </span>
            <span className="text-lg font-bold tracking-tight">
              СпецТехника
            </span>
          </Link>
          <Link
            href="/catalog"
            className="text-sm text-slate-300 hover:text-white"
          >
            ← Ко всему каталогу
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        {loading ? <p>Загрузка...</p> : null}

        {!loading && (errorMessage || !item) ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {errorMessage ?? "Объявление не найдено."}
          </div>
        ) : null}

        {!loading && item ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {photoUrl(item.cover_photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl(item.cover_photo_path)!}
                    alt={item.equipment_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl" aria-hidden="true">
                    🚜
                  </span>
                )}
              </div>

              {item.description ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="font-semibold">Описание</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              {item.category ? (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                  {EQUIPMENT_CATEGORY_LABELS[item.category]}
                </p>
              ) : null}
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {item.equipment_name}
              </h1>

              <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
                {item.price_hour ? (
                  <p className="flex justify-between text-sm">
                    <span className="text-slate-500">Цена за час</span>
                    <span className="font-semibold">
                      {item.price_hour.toLocaleString("ru-RU")} ₽
                    </span>
                  </p>
                ) : null}
                {item.price_shift ? (
                  <p className="flex justify-between text-sm">
                    <span className="text-slate-500">Цена за смену</span>
                    <span className="font-semibold">
                      {item.price_shift.toLocaleString("ru-RU")} ₽
                    </span>
                  </p>
                ) : null}
                {!item.price_hour && !item.price_shift ? (
                  <p className="text-sm text-slate-500">
                    Цена по запросу — уточните у компании.
                  </p>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold">{item.company.name}</h2>
                {item.company.city ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.company.city}
                  </p>
                ) : null}
                {item.company.phone ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.company.phone}
                  </p>
                ) : null}
                {item.company.email ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.company.email}
                  </p>
                ) : null}
              </div>

              <Link
                href="/requests/new"
                className="mt-5 block rounded-xl bg-slate-950 px-5 py-3.5 text-center font-semibold text-white transition hover:bg-slate-800"
              >
                Оставить заявку
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

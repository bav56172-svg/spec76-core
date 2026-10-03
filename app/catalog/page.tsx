"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { listPublicCatalog, type CatalogListing } from "@/services/catalog";
import { supabase } from "@/services/supabase";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
} from "@/types/equipment-category";
import type { EquipmentCategory } from "@/types/equipment-category";

// OP-034: Public Equipment Catalog Foundation (see ADR-028). Public page —
// no auth check, reachable by guests. middleware.ts doesn't match plain
// page routes, and the anon RLS policy on company_equipment is what
// actually restricts which rows come back.

function photoUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("equipment-photos").getPublicUrl(path).data
    .publicUrl;
}

export default function CatalogPage() {
  const [listings, setListings] = useState<CatalogListing[]>([]);
  const [category, setCategory] = useState<EquipmentCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchListings() {
      setLoading(true);
      const result = await listPublicCatalog(
        category ? { category } : undefined,
      );

      if (!active) return;

      if (result.error) {
        setErrorMessage(result.error.message);
        setLoading(false);
        return;
      }

      setListings(result.data);
      setErrorMessage(null);
      setLoading(false);
    }

    void fetchListings();

    return () => {
      active = false;
    };
  }, [category]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" translate="no">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950">
              76
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                СпецТехника
              </span>
              <span className="block text-xs text-slate-400">
                Каталог объявлений
              </span>
            </span>
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Войти
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Ярославская область
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Каталог спецтехники
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Все объявления проверенных компаний региона. Нашли подходящую
          технику — оставьте заявку, и мы свяжем вас с исполнителем.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === ""
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Все категории
          </button>
          {EQUIPMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === cat
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {EQUIPMENT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {loading ? <p className="mt-10">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            Пока нет опубликованных объявлений в этой категории.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => {
            const image = photoUrl(item.cover_photo_path);
            return (
              <Link
                key={item.id}
                href={`/catalog/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center bg-slate-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={item.equipment_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl" aria-hidden="true">
                      🚜
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {item.category ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                      {EQUIPMENT_CATEGORY_LABELS[item.category]}
                    </p>
                  ) : null}
                  <h3 className="mt-1 text-lg font-semibold">
                    {item.equipment_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.company.name}
                    {item.company.city ? ` · ${item.company.city}` : ""}
                  </p>
                  {item.price_hour ? (
                    <p className="mt-3 font-semibold text-slate-950">
                      {item.price_hour.toLocaleString("ru-RU")} ₽/час
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

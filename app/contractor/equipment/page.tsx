"use client";

import { useEffect, useState } from "react";

import { getCurrentUserCompany } from "@/services/companies";
import {
  addCompanyEquipment,
  listCompanyEquipment,
  removeCompanyEquipment,
  updateCompanyEquipment,
  uploadEquipmentPhoto,
} from "@/services/equipment";
import { supabase } from "@/services/supabase";
import type { Equipment } from "@/types/equipment";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
} from "@/types/equipment-category";

// OP-034: Public Equipment Catalog Foundation — turns a bare "Моя
// техника" entry into something publishable (category, price,
// description, photo), with an explicit draft/published toggle. See
// ADR-028.

function equipmentPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("equipment-photos").getPublicUrl(path).data
    .publicUrl;
}

export default function MyEquipmentPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchEquipment() {
      const companyResult = await getCurrentUserCompany();

      if (!active) return;

      if (companyResult.error) {
        if (companyResult.error.code !== "AUTH_REQUIRED") {
          setErrorMessage(companyResult.error.message);
        }
        setLoading(false);
        return;
      }

      if (!companyResult.data) {
        setNoCompany(true);
        setLoading(false);
        return;
      }

      setCompanyId(companyResult.data.id);

      const equipmentResult = await listCompanyEquipment(
        companyResult.data.id,
      );

      if (!active) return;

      if (equipmentResult.error) {
        setErrorMessage(equipmentResult.error.message);
        setLoading(false);
        return;
      }

      setEquipment(equipmentResult.data);
      setLoading(false);
    }

    void fetchEquipment();

    return () => {
      active = false;
    };
  }, []);

  function replaceEquipment(updated: Equipment) {
    setEquipment((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleAdd() {
    if (!companyId || !newEquipmentName.trim()) return;

    setSaving(true);
    const result = await addCompanyEquipment(companyId, {
      equipment_name: newEquipmentName.trim(),
    });
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    setEquipment((current) => [result.data, ...current]);
    setNewEquipmentName("");
  }

  async function handleRemove(equipmentId: string) {
    const result = await removeCompanyEquipment(equipmentId);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    setEquipment((current) =>
      current.filter((item) => item.id !== equipmentId),
    );
  }

  async function handleFieldUpdate(
    item: Equipment,
    field: "category" | "price_hour" | "price_shift" | "description",
    value: string,
  ) {
    setSavingId(item.id);

    const input =
      field === "price_hour" || field === "price_shift"
        ? { [field]: value ? Number(value) : null }
        : { [field]: value || null };

    const result = await updateCompanyEquipment(item.id, input);
    setSavingId(null);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    replaceEquipment(result.data);
  }

  async function handleTogglePublish(item: Equipment) {
    setSavingId(item.id);
    const nextStatus = item.status === "published" ? "draft" : "published";
    const result = await updateCompanyEquipment(item.id, {
      status: nextStatus,
    });
    setSavingId(null);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    replaceEquipment(result.data);
  }

  async function handlePhotoChange(
    item: Equipment,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file || !companyId) return;

    setSavingId(item.id);
    const result = await uploadEquipmentPhoto(companyId, item.id, file);
    setSavingId(null);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    replaceEquipment(result.data);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Моя техника</h1>
        <p className="mt-2 text-gray-600">
          Список техники используется при подборе заказов. Заполните
          категорию, цену, фото и описание, затем опубликуйте — объявление
          появится в публичном каталоге (
          <a href="/catalog" className="text-blue-600 hover:underline">
            /catalog
          </a>
          ).
        </p>

        {loading ? <p className="mt-8">Загрузка...</p> : null}

        {!loading && errorMessage ? (
          <div className="mt-6 rounded-xl bg-white p-6 shadow">
            {errorMessage}
          </div>
        ) : null}

        {!loading && noCompany ? (
          <div className="mt-6 rounded-xl bg-white p-6 shadow">
            Сначала создайте профиль компании, чтобы вести список техники.
          </div>
        ) : null}

        {!loading && !noCompany ? (
          <>
            <div className="mt-6 flex gap-3">
              <input
                type="text"
                value={newEquipmentName}
                onChange={(event) => setNewEquipmentName(event.target.value)}
                placeholder="Например: Экскаватор JCB 3CX"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !newEquipmentName.trim()}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {equipment.length === 0 ? (
                <div className="rounded-xl bg-white p-6 shadow">
                  Техника пока не добавлена.
                </div>
              ) : null}

              {equipment.map((item) => {
                const isExpanded = expandedId === item.id;
                const photoUrl = equipmentPhotoUrl(item.cover_photo_path);
                const isBusy = savingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-white p-4 shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt={item.equipment_name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : null}
                        <div>
                          <span className="font-medium">
                            {item.equipment_name}
                          </span>
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                              item.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status === "published"
                              ? "Опубликовано"
                              : item.status === "archived"
                                ? "В архиве"
                                : "Черновик"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {isExpanded ? "Свернуть" : "Редактировать"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(item)}
                          disabled={isBusy}
                          className="text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {item.status === "published"
                            ? "Снять с публикации"
                            : "Опубликовать"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="text-red-600 hover:underline"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                        <select
                          defaultValue={item.category ?? ""}
                          onBlur={(event) =>
                            handleFieldUpdate(
                              item,
                              "category",
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="">Категория не выбрана</option>
                          {EQUIPMENT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {EQUIPMENT_CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            void handlePhotoChange(item, event)
                          }
                          className="text-sm"
                        />

                        <input
                          type="number"
                          defaultValue={item.price_hour ?? ""}
                          onBlur={(event) =>
                            handleFieldUpdate(
                              item,
                              "price_hour",
                              event.target.value,
                            )
                          }
                          placeholder="Цена за час, ₽"
                          className="rounded-lg border border-gray-300 px-3 py-2"
                        />

                        <input
                          type="number"
                          defaultValue={item.price_shift ?? ""}
                          onBlur={(event) =>
                            handleFieldUpdate(
                              item,
                              "price_shift",
                              event.target.value,
                            )
                          }
                          placeholder="Цена за смену, ₽"
                          className="rounded-lg border border-gray-300 px-3 py-2"
                        />

                        <textarea
                          defaultValue={item.description ?? ""}
                          onBlur={(event) =>
                            handleFieldUpdate(
                              item,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Описание"
                          className="col-span-2 rounded-lg border border-gray-300 px-3 py-2"
                          rows={3}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

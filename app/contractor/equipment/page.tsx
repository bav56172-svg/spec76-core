"use client";

import { useEffect, useState } from "react";

import { getCurrentUserCompany } from "@/services/companies";
import {
  addCompanyEquipment,
  listCompanyEquipment,
  removeCompanyEquipment,
} from "@/services/equipment";
import type { Equipment } from "@/types/equipment";

export default function MyEquipmentPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);

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

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Моя техника</h1>
        <p className="mt-2 text-gray-600">
          Список техники используется при подборе заказов — заявки будут
          сопоставляться с тем, что указано здесь.
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

              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
                >
                  <span>{item.equipment_name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

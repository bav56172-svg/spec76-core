"use client";

import { useEffect, useState } from "react";

import { listCompanies } from "@/services/companies";
import {
  getMyPlatformRole,
  listPlatformRoles,
  setPlatformRole,
} from "@/services/permissions";
import { getMyRequests } from "@/services/requests";
import type { PlatformRole, PlatformRoleRecord } from "@/types/platform-role";

const ASSIGNABLE_ROLES: PlatformRole[] = [
  "user",
  "moderator",
  "administrator",
  "platform_owner",
];

export default function AdminControlCenterPage() {
  const [myRole, setMyRole] = useState<PlatformRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [companiesCount, setCompaniesCount] = useState<number | null>(null);
  const [requestsCount, setRequestsCount] = useState<number | null>(null);
  const [roles, setRoles] = useState<PlatformRoleRecord[]>([]);

  const [newUserId, setNewUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState<PlatformRole>("moderator");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const roleResult = await getMyPlatformRole();

      if (!active) return;

      if (roleResult.error) {
        if (roleResult.error.code !== "AUTH_REQUIRED") {
          setErrorMessage(roleResult.error.message);
        }
        setLoading(false);
        return;
      }

      setMyRole(roleResult.data);

      if (roleResult.data === "user") {
        // Not a moderator/administrator/platform_owner — nothing else to
        // load. The page below renders a plain "access denied" message.
        setLoading(false);
        return;
      }

      const [companiesResult, requestsResult, rolesResult] =
        await Promise.all([
          listCompanies(),
          getMyRequests(),
          listPlatformRoles(),
        ]);

      if (!active) return;

      if (companiesResult.error) {
        setErrorMessage(companiesResult.error.message);
      } else {
        setCompaniesCount(companiesResult.data.length);
      }

      // getMyRequests() is customer-scoped by RLS; used here only as a
      // stand-in count until a platform-wide requests count exists.
      // NOTE for reviewer: this undercounts — see PR description.
      if (!requestsResult.error) {
        setRequestsCount(requestsResult.data.length);
      }

      if (rolesResult.error) {
        setErrorMessage(rolesResult.error.message);
      } else {
        setRoles(rolesResult.data);
      }

      setLoading(false);
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function handleAssignRole() {
    if (!newUserId.trim()) return;

    setSaving(true);
    const result = await setPlatformRole(newUserId.trim(), newUserRole);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    setRoles((current) => {
      const withoutOld = current.filter(
        (entry) => entry.user_id !== result.data.user_id,
      );
      return [...withoutOld, result.data];
    });
    setNewUserId("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (!myRole || myRole === "user") {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
          Этот раздел доступен только модераторам, администраторам и
          владельцу платформы.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Центр управления платформой</h1>

        {errorMessage ? (
          <div className="mt-6 rounded-xl bg-white p-4 text-red-600 shadow">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Компаний</p>
            <p className="text-3xl font-bold">{companiesCount ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Заявок (только ваши, временно)
            </p>
            <p className="text-3xl font-bold">{requestsCount ?? "—"}</p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Платформенные роли</h2>

        {myRole === "platform_owner" || myRole === "administrator" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={newUserId}
              onChange={(event) => setNewUserId(event.target.value)}
              placeholder="user_id (uuid)"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
            />
            <select
              value={newUserRole}
              onChange={(event) =>
                setNewUserRole(event.target.value as PlatformRole)
              }
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssignRole}
              disabled={saving || !newUserId.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Назначить
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {roles.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
            >
              <span className="font-mono text-sm">{entry.user_id}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {entry.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

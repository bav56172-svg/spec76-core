"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useProjectContext } from "@/app/hooks/useProjectContext";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const pathname = usePathname();

  const { project } = useProjectContext();

  const tabs = [
    { name: "Overview", path: "" },
    { name: "Tasks", path: "/tasks" },
    { name: "Docs", path: "/docs" },
    { name: "AI", path: "/ai" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-6 py-4">
          
          {/* Project Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {project?.title ?? "Project"}
              </h1>

              <p className="text-sm text-gray-500">
                {project?.description}
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded bg-gray-100">
              {project?.status}
            </span>
          </div>

          {/* TABS */}
          <div className="mt-4 flex gap-6 text-sm">
            {tabs.map((tab) => {
              const href = `/projects/${id}${tab.path}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={tab.name}
                  href={href}
                  className={`pb-2 border-b-2 transition ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl p-6">
        {children}
      </main>
    </div>
  );
}
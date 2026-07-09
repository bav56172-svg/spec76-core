"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProject } from "@/services/projects";
import { Project } from "@/types/project";

export function useProjectContext() {
  const params = useParams();
  const projectId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      setLoading(true);

      const { data } = await getProject(projectId);

      setProject(data);
      setLoading(false);
    }

    load();
  }, [projectId]);

  return {
    project,
    loading,
    projectId,
  };
}
"use client";

import { useEffect, useState } from "react";

import { useProjectContext } from "@/app/hooks/useProjectContext";

/**
 * REAL-TIME AI (живой AI слой)
 * реагирует на изменения проекта
 */
export function useRealtimeAI() {
  const { project } = useProjectContext();

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project?.id) return;

    const interval = setInterval(() => {
      runAnalysis();
    }, 15000); // каждые 15 секунд

    runAnalysis();

    return () => clearInterval(interval);
  }, [project?.id]);

  async function runAnalysis() {
    if (!project) return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai/realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project }),
      });

      const data = await res.json();

      setAnalysis(data);
    } catch (e) {
      console.error("Realtime AI error:", e);
    }

    setLoading(false);
  }

  return {
    analysis,
    loading,
    refresh: runAnalysis,
  };
}
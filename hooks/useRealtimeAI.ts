import { useEffect } from "react";
import { supabase } from "@/services/supabase";

/**
 * 🧠 REAL-TIME AI ENGINE
 * реагирует на изменения задач
 */
export function useRealtimeAI(
  projectId: string,
  onAIUpdate: (data: any) => void
) {
  useEffect(() => {
    if (!projectId) return;

    /**
     * 🔁 SUBSCRIBE TO TASK CHANGES
     */
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        async () => {
          /**
           * 🧠 CALL AUTOPILOT AUTOMATICALLY
           */
          const res = await fetch("/api/ai/autopilot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectId }),
          });

          const data = await res.json();

          onAIUpdate(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onAIUpdate]);
}
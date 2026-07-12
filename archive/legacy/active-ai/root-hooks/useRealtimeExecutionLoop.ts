import { useEffect, useRef } from "react";
import { supabase } from "@/services/supabase";

/**
 * 🧠 REAL-TIME EXECUTION LOOP
 * (EVENT → AI → ACTION → EXECUTION → UPDATE → AI)
 */
export function useRealtimeExecutionLoop(
  projectId: string,
  runAutopilot: (projectId: string) => Promise<any>,
  executeAction: (action: any) => Promise<void>
) {
  const processing = useRef(false);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("execution-loop")
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
           * ❗ PREVENT LOOP SPAM
           */
          if (processing.current) return;

          processing.current = true;

          try {
            /**
             * 🧠 STEP 1 — AI ANALYSIS
             */
            const result = await runAutopilot(projectId);

            /**
             * 🧠 STEP 2 — EXECUTE ACTIONS
             */
            if (result?.actions?.length) {
              for (const action of result.actions) {
                await executeAction(action);
              }
            }

          } finally {
            processing.current = false;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, runAutopilot, executeAction]);
}
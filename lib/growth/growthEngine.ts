import { supabase } from "@/services/supabase";
import { AICostOptimizationEngine } from "@/lib/ai/costOptimizationEngine";

/**
 * 🧠 AI GROWTH ENGINE
 * system that grows itself via user behavior + AI loops
 */
export class AIGrowthEngine {
  /**
   * 🚀 MAIN ENTRY
   */
  static async run(projectId: string) {
    const users = await this.getUsers(projectId);

    const metrics = await this.calculateMetrics(projectId);

    const growthActions = this.generateGrowthActions(metrics);

    const optimized = await AICostOptimizationEngine.optimize(
      { projectId, tasks: [], memory: [] },
      growthActions
    );

    await this.executeGrowthActions(projectId, optimized);

    return {
      metrics,
      actions: optimized,
    };
  }

  /**
   * 🧠 USER FETCH
   */
  private static async getUsers(projectId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("project_id", projectId);

    return data || [];
  }

  /**
   * 📊 METRICS ENGINE
   */
  private static async calculateMetrics(projectId: string) {
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("project_id", projectId);

    const total = events?.length || 0;

    const active = events?.filter(
      (e) => e.type === "active_session"
    ).length || 0;

    const retention =
      total === 0 ? 0 : Math.round((active / total) * 100);

    return {
      totalUsers: total,
      activeUsers: active,
      retention,
      growthScore: retention > 70 ? "high" : "medium",
    };
  }

  /**
   * 🧠 GROWTH STRATEGY GENERATION
   */
  private static generateGrowthActions(metrics: any) {
    const actions = [];

    /**
     * 🟢 LOW RETENTION STRATEGY
     */
    if (metrics.retention < 50) {
      actions.push({
        type: "create_task",
        payload: {
          title: "Improve onboarding flow",
        },
      });

      actions.push({
        type: "create_task",
        payload: {
          title: "Add AI onboarding assistant",
        },
      });
    }

    /**
     * 🟢 HIGH GROWTH STRATEGY
     */
    if (metrics.retention > 70) {
      actions.push({
        type: "create_task",
        payload: {
          title: "Scale infrastructure for growth",
        },
      });

      actions.push({
        type: "create_task",
        payload: {
          title: "Launch referral system",
        },
      });
    }

    return actions;
  }

  /**
   * ⚡ EXECUTE GROWTH ACTIONS
   */
  private static async executeGrowthActions(
    projectId: string,
    actions: any[]
  ) {
    for (const action of actions) {
      await supabase.from("tasks").insert({
        project_id: projectId,
        title: action.payload.title,
        status: "todo",
        type: "growth",
      });
    }
  }
}
import { supabase } from "@/services/supabase";

/**
 * 🧠 AI SAAS ENGINE
 * multi-tenant + billing + quotas + access control
 */

type UserContext = {
  userId: string;
  projectId: string;
};

export class SaaSEngine {
  /**
   * 🟢 CHECK ACCESS
   */
  static async checkAccess(ctx: UserContext) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", ctx.userId)
      .single();

    if (!user) return false;

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", ctx.projectId)
      .single();

    if (!project) return false;

    /**
     * ❗ OWNERSHIP CHECK
     */
    if (project.user_id !== ctx.userId) {
      return false;
    }

    return true;
  }

  /**
   * 🧠 QUOTA CHECK (AI usage limits)
   */
  static async checkQuota(userId: string) {
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!usage) return true;

    /**
     * ❗ SIMPLE LIMIT MODEL
     */
    const LIMIT = 1000;

    return usage.count < LIMIT;
  }

  /**
   * 🟢 INCREMENT USAGE
   */
  static async trackUsage(userId: string, type: string) {
    const { data } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) {
      await supabase.from("ai_usage").insert({
        user_id: userId,
        count: 1,
        type,
      });
    } else {
      await supabase
        .from("ai_usage")
        .update({
          count: data.count + 1,
        })
        .eq("user_id", userId);
    }
  }

  /**
   * 🧠 BILLING STATE
   */
  static async getBilling(userId: string) {
    const { data } = await supabase
      .from("billing")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data;
  }

  /**
   * 🟢 PLAN CHECK
   */
  static async getPlan(userId: string) {
    const billing = await this.getBilling(userId);

    if (!billing) return "free";

    return billing.plan || "free";
  }

  /**
   * 🚀 FEATURE GATES
   */
  static async canUseFeature(
    userId: string,
    feature: string
  ) {
    const plan = await this.getPlan(userId);

    const featuresByPlan: Record<string, string[]> = {
      free: ["kanban", "ai_basic"],
      pro: ["kanban", "ai_basic", "ai_autopilot"],
      enterprise: [
        "kanban",
        "ai_basic",
        "ai_autopilot",
        "ai_agents",
        "real_time_loop",
      ],
    };

    return (
      featuresByPlan[plan]?.includes(feature) || false
    );
  }
}
import { supabase } from "@/services/supabase";

/**
 * 🧠 AI USAGE BILLING SYSTEM
 */
export class UsageBilling {
  /**
   * 🟢 TRACK AI ACTION USAGE
   */
  static async track(userId: string, type: string) {
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
   * 🟢 GET USAGE LIMIT
   */
  static getLimit(plan: string) {
    switch (plan) {
      case "free":
        return 100;
      case "pro":
        return 1000;
      case "enterprise":
        return 10000;
      default:
        return 50;
    }
  }

  /**
   * 🟢 CHECK IF ALLOWED
   */
  static async canUse(userId: string, plan: string) {
    const { data } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    const usage = data?.count || 0;
    const limit = this.getLimit(plan);

    return usage < limit;
  }
}
import { AIAction } from "./ruleEngine";

type Context = {
  userId: string;
  projectId: string;
  tasks: any[];
  memory?: any[];
  billing?: any;
};

type Decision = {
  allowed: boolean;
  reason?: string;
  severity?: "low" | "medium" | "high";
};

/**
 * 🧠 AI AUTONOMY POLICY LAYER
 * final authority over ALL AI actions
 */
export class AIAutonomyPolicy {
  /**
   * 🟢 MAIN ENTRY
   */
  static evaluate(action: AIAction, context: Context): Decision {
    if (!action?.type) {
      return {
        allowed: false,
        reason: "Invalid action",
        severity: "high",
      };
    }

    /**
     * 🚨 RULE 1 — BILLING SAFETY (NO FREE UNLIMITED AI)
     */
    if (context.billing?.status === "canceled") {
      return {
        allowed: false,
        reason: "Subscription inactive",
        severity: "high",
      };
    }

    /**
     * 🚨 RULE 2 — QUOTA LIMITS
     */
    if ((context.billing?.usage || 0) > 10000) {
      return {
        allowed: false,
        reason: "Quota exceeded",
        severity: "high",
      };
    }

    /**
     * 🚨 RULE 3 — SYSTEM SAFETY (NO DESTRUCTIVE ACTIONS)
     */
    if (this.isDestructive(action)) {
      return {
        allowed: false,
        reason: "Destructive action blocked by autonomy policy",
        severity: "high",
      };
    }

    /**
     * 🚨 RULE 4 — MEMORY OVERFLOW PROTECTION
     */
    if (context.memory && context.memory.length > 100) {
      if (action.type === "create_task") {
        return {
          allowed: true,
          reason: "Allowed but memory is saturated",
          severity: "medium",
        };
      }
    }

    /**
     * 🟢 RULE 5 — NORMAL OPERATIONS ALLOWED
     */
    return {
      allowed: true,
      reason: "Approved by autonomy policy",
      severity: "low",
    };
  }

  /**
   * 🚫 DESTRUCTIVE ACTION FILTER
   */
  private static isDestructive(action: AIAction): boolean {
    const blocked = [
      "delete_database",
      "drop_table",
      "exec_shell",
      "system_override",
      "self_modify_system",
      "disable_rules",
      "bypass_billing",
      "corrupt_memory",
    ];

    return blocked.includes(action.type);
  }

  /**
   * 🧠 BATCH EVALUATION (FOR MULTI-ACTIONS)
   */
  static evaluateBatch(actions: AIAction[], context: Context) {
    return actions.map((action) => ({
      action,
      decision: this.evaluate(action, context),
    }));
  }

  /**
   * 🟢 FILTER ONLY ALLOWED ACTIONS
   */
  static filterAllowed(actions: AIAction[], context: Context) {
    return actions.filter(
      (a) => this.evaluate(a, context).allowed
    );
  }

  /**
   * 📊 SYSTEM AUTONOMY SCORE
   */
  static getAutonomyScore(context: Context) {
    let score = 100;

    if (context.billing?.status === "canceled") score -= 50;
    if ((context.billing?.usage || 0) > 8000) score -= 20;
    if (context.memory && context.memory.length > 80)
      score -= 10;

    return Math.max(score, 0);
  }
}
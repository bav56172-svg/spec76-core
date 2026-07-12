export type AIAction = {
  type: string;
  payload: any;
};

export type AIRuleContext = {
  projectId: string;
  tasks: any[];
  memory?: any[];
};

/**
 * 🧠 AI RULE ENGINE
 * Central control layer for all AI actions
 */
export class AIRuleEngine {
  /**
   * 🟢 MAIN ENTRY
   */
  static validate(actions: AIAction[], context: AIRuleContext): AIAction[] {
    if (!actions || !Array.isArray(actions)) return [];

    return actions
      .map((action) => this.applyRules(action, context))
      .filter(Boolean) as AIAction[];
  }

  /**
   * 🧠 RULE PIPELINE
   */
  private static applyRules(
    action: AIAction,
    context: AIRuleContext
  ): AIAction | null {
    if (!action?.type) return null;

    /**
     * 🚫 RULE 1 — BLOCK DANGEROUS OPERATIONS
     */
    if (this.isDangerous(action)) {
      return null;
    }

    /**
     * 🚫 RULE 2 — LIMIT TASK CREATION SPAM
     */
    if (action.type === "create_task") {
      if (context.tasks.length > 200) {
        return null;
      }
    }

    /**
     * 🚫 RULE 3 — VALIDATE REQUIRED PAYLOADS
     */
    if (action.type === "create_task") {
      if (!action.payload?.title) return null;
    }

    if (action.type === "rename_task") {
      if (!action.payload?.id || !action.payload?.title) {
        return null;
      }
    }

    /**
     * 🚫 RULE 4 — EMPTY TITLE FILTER
     */
    if (action.payload?.title === "") {
      return null;
    }

    /**
     * 🟢 RULE 5 — NORMALIZATION
     */
    return this.normalize(action);
  }

  /**
   * 🚨 SAFETY FILTER
   */
  private static isDangerous(action: AIAction): boolean {
    const forbidden = [
      "delete_database",
      "drop_table",
      "exec_shell",
      "system_override",
      "self_modify_system",
    ];

    return forbidden.includes(action.type);
  }

  /**
   * 🧠 NORMALIZATION LAYER
   */
  private static normalize(action: AIAction): AIAction {
    return {
      type: action.type.trim().toLowerCase(),
      payload: action.payload || {},
    };
  }

  /**
   * 🟢 FINAL OUTPUT BUILDER
   */
  static process(actions: AIAction[], context: AIRuleContext) {
    const validated = this.validate(actions, context);

    return {
      actions: validated,
      meta: {
        total: actions?.length || 0,
        approved: validated.length,
        blocked: (actions?.length || 0) - validated.length,
      },
    };
  }
}
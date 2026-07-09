import { AIAction } from "./ruleEngine";

type Context = {
  tasks: any[];
  memory?: any[];
  projectId: string;
};

/**
 * 🧠 AI COST OPTIMIZATION ENGINE
 * reduces AI cost, token usage, and redundant calls
 */
export class AICostOptimizationEngine {
  private static cache: Map<string, any> = new Map();

  /**
   * 🟢 MAIN ENTRY
   */
  static async optimize(context: Context, actions: AIAction[]) {
    let optimized = actions;

    optimized = this.applyCaching(context, optimized);
    optimized = this.bundleActions(optimized);
    optimized = this.routeModels(context, optimized);
    optimized = this.pruneContext(context);

    return optimized;
  }

  /**
   * 🧠 1. CACHING LAYER
   */
  private static applyCaching(
    context: Context,
    actions: AIAction[]
  ): AIAction[] {
    const key = context.projectId;

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    this.cache.set(key, actions);

    return actions;
  }

  /**
   * ⚡ 2. ACTION BUNDLING
   */
  private static bundleActions(actions: AIAction[]): AIAction[] {
    const bundled: Record<string, AIAction> = {};

    for (const action of actions) {
      const key = action.type;

      if (!bundled[key]) {
        bundled[key] = action;
      } else {
        /**
         * merge payloads instead of duplicates
         */
        bundled[key].payload = {
          ...bundled[key].payload,
          ...action.payload,
        };
      }
    }

    return Object.values(bundled);
  }

  /**
   * 🧠 3. MODEL ROUTING LOGIC
   */
  private static routeModels(
    context: Context,
    actions: AIAction[]
  ): AIAction[] {
    return actions.map((action) => {
      const complexity = this.calculateComplexity(action, context);

      return {
        ...action,
        meta: {
          model:
            complexity > 7
              ? "gpt-4o"
              : "gpt-4o-mini",
        },
      };
    });
  }

  /**
   * 📊 COMPLEXITY SCORING
   */
  private static calculateComplexity(
    action: AIAction,
    context: Context
  ): number {
    let score = 1;

    if (action.type === "break_task") score += 3;
    if (action.type === "create_task") score += 2;
    if (context.tasks.length > 20) score += 2;
    if (context.memory && context.memory.length > 30)
      score += 2;

    return score;
  }

  /**
   * 🧠 4. CONTEXT PRUNING (token optimization)
   */
  private static pruneContext(context: Context): Context {
    return {
      ...context,
      memory: (context.memory || []).slice(-20),
      tasks: (context.tasks || []).slice(-50),
    };
  }

  /**
   * 🟢 FINAL OUTPUT
   */
  static finalize(actions: AIAction[]) {
    return {
      actions,
      meta: {
        optimized: true,
        timestamp: Date.now(),
      },
    };
  }
}
import { AIAction } from "./ruleEngine";

type Context = {
  projectId: string;
  tasks: any[];
  memory?: any[];
};

type StableAction = AIAction & {
  priority?: number;
  source?: string;
};

/**
 * 🧠 AI STABILITY LAYER
 * prevents chaos, loops, duplication, conflicts
 */
export class AIStabilityLayer {
  private static lastActions: Map<string, string[]> = new Map();
  private static actionTimestamps: Map<string, number[]> = new Map();

  /**
   * 🟢 MAIN ENTRY
   */
  static process(actions: AIAction[], context: Context): StableAction[] {
    if (!actions || actions.length === 0) return [];

    let stable = actions.map((a) => this.normalize(a));

    stable = this.deduplicate(stable, context);
    stable = this.rateLimit(stable, context);
    stable = this.resolveConflicts(stable);
    stable = this.prioritize(stable, context);

    return stable;
  }

  /**
   * 🧠 NORMALIZATION
   */
  private static normalize(action: AIAction): StableAction {
    return {
      ...action,
      type: action.type?.trim().toLowerCase(),
      payload: action.payload || {},
    };
  }

  /**
   * 🚫 DEDUPLICATION ENGINE
   */
  private static deduplicate(
    actions: StableAction[],
    context: Context
  ): StableAction[] {
    const key = context.projectId;

    const seen = new Set<string>();
    const result: StableAction[] = [];

    for (const action of actions) {
      const signature = `${action.type}:${JSON.stringify(
        action.payload
      )}`;

      if (seen.has(signature)) continue;

      seen.add(signature);
      result.push(action);
    }

    return result;
  }

  /**
   * 🚫 RATE LIMITING (anti AI storm)
   */
  private static rateLimit(
    actions: StableAction[],
    context: Context
  ): StableAction[] {
    const now = Date.now();
    const key = context.projectId;

    const timestamps = this.actionTimestamps.get(key) || [];

    const recent = timestamps.filter(
      (t) => now - t < 5000
    );

    /**
     * ❗ LIMIT: max 10 actions per 5 sec
     */
    if (recent.length > 10) {
      return [];
    }

    this.actionTimestamps.set(key, [
      ...recent,
      ...actions.map(() => now),
    ]);

    return actions;
  }

  /**
   * ⚔️ CONFLICT RESOLUTION
   */
  private static resolveConflicts(
    actions: StableAction[]
  ): StableAction[] {
    const map = new Map<string, StableAction>();

    for (const action of actions) {
      const key = action.payload?.id || action.type;

      /**
       * last write wins
       */
      map.set(key, action);
    }

    return Array.from(map.values());
  }

  /**
   * 🧠 PRIORITY SCORING ENGINE
   */
  private static prioritize(
    actions: StableAction[],
    context: Context
  ): StableAction[] {
    return actions
      .map((action) => {
        let score = 1;

        /**
         * 🟢 CREATE TASK = high priority
         */
        if (action.type === "create_task") {
          score += 3;
        }

        /**
         * 🟡 UPDATE = medium priority
         */
        if (action.type === "rename_task") {
          score += 2;
        }

        /**
         * 🟣 MEMORY ACTIONS = low priority
         */
        if (action.type.includes("memory")) {
          score += 1;
        }

        return {
          ...action,
          priority: score,
        };
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * 🟢 FINAL SAFE OUTPUT
   */
  static finalize(actions: StableAction[]) {
    return {
      actions,
      meta: {
        total: actions.length,
        stable: true,
        timestamp: Date.now(),
      },
    };
  }
}
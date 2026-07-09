import { AIRuleEngine, AIAction } from "./ruleEngine";

/**
 * 🧠 CONTEXT FOR ALL AGENTS
 */
export type AgentContext = {
  projectId: string;
  tasks: any[];
  memory?: any[];
  autopilot?: any;
};

/**
 * 🟢 BASE AGENT INTERFACE
 */
interface Agent {
  name: string;
  run(context: AgentContext): Promise<AIAction[]>;
}

/**
 * 🧠 PLANNER AGENT
 * создаёт стратегические действия
 */
class PlannerAgent implements Agent {
  name = "planner";

  async run(context: AgentContext): Promise<AIAction[]> {
    const actions: AIAction[] = [];

    if (context.tasks.length === 0) {
      actions.push({
        type: "create_task",
        payload: {
          title: "Initial project setup",
        },
      });
    }

    if (context.tasks.length > 10) {
      actions.push({
        type: "break_task",
        payload: {
          title: "Refactor task structure",
        },
      });
    }

    return actions;
  }
}

/**
 * ⚡ EXECUTOR AGENT
 * усиливает и уточняет действия
 */
class ExecutorAgent implements Agent {
  name = "executor";

  async run(context: AgentContext): Promise<AIAction[]> {
    const actions: AIAction[] = [];

    for (const task of context.tasks) {
      if (task.status === "todo" && task.title.length < 5) {
        actions.push({
          type: "rename_task",
          payload: {
            id: task.id,
            title: task.title + " (expand)",
          },
        });
      }
    }

    return actions;
  }
}

/**
 * 🔍 REVIEWER AGENT
 * проверяет качество системы
 */
class ReviewerAgent implements Agent {
  name = "reviewer";

  async run(context: AgentContext): Promise<AIAction[]> {
    const actions: AIAction[] = [];

    const doneTasks = context.tasks.filter(
      (t) => t.status === "done"
    );

    if (doneTasks.length > context.tasks.length * 0.7) {
      actions.push({
        type: "create_task",
        payload: {
          title: "Project review & cleanup",
        },
      });
    }

    return actions;
  }
}

/**
 * 🧱 MEMORY AGENT
 * анализирует историю
 */
class MemoryAgent implements Agent {
  name = "memory";

  async run(context: AgentContext): Promise<AIAction[]> {
    const actions: AIAction[] = [];

    if (context.memory && context.memory.length > 20) {
      actions.push({
        type: "create_task",
        payload: {
          title: "Optimize AI memory storage",
        },
      });
    }

    return actions;
  }
}

/**
 * 🧠 MULTI-AGENT ORCHESTRATOR
 */
export class MultiAgentSystem {
  private agents: Agent[];

  constructor() {
    this.agents = [
      new PlannerAgent(),
      new ExecutorAgent(),
      new ReviewerAgent(),
      new MemoryAgent(),
    ];
  }

  /**
   * 🚀 RUN ALL AGENTS
   */
  async run(context: AgentContext) {
    let allActions: AIAction[] = [];

    for (const agent of this.agents) {
      const actions = await agent.run(context);
      allActions.push(...actions);
    }

    /**
     * 🧠 RULE ENGINE FILTER (CRITICAL LAYER)
     */
    const processed = AIRuleEngine.process(allActions, context);

    return processed;
  }
}
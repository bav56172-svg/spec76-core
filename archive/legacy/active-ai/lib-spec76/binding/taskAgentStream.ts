type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
};

type AgentType = "QA" | "Safety" | "Compliance" | "DataIntegrity";

type AgentEvent = {
  taskId: string;
  agent: AgentType;
  status: "running" | "passed" | "warning" | "failed";
  message: string;
  timestamp: number;
};

// 🟢 MAIN BINDING ENGINE
export class TaskAgentStreamBinding {
  private listeners: Map<string, (event: AgentEvent) => void> = new Map();

  // 🟢 subscribe UI or stream
  subscribe(taskId: string, cb: (event: AgentEvent) => void) {
    this.listeners.set(taskId, cb);
  }

  // 🟢 emit event to UI
  private emit(taskId: string, event: AgentEvent) {
    const listener = this.listeners.get(taskId);
    if (listener) listener(event);
  }

  // 🟢 CORE FUNCTION: attach task → agent execution
  async runAgentsForTask(task: Task) {
    const agents: AgentType[] = [
      "QA",
      "Safety",
      "Compliance",
      "DataIntegrity",
    ];

    for (const agent of agents) {
      await this.runAgent(task.id, agent);
    }
  }

  // 🟢 simulate / later replace with real AI engine
  private async runAgent(taskId: string, agent: AgentType) {
    const steps = [
      "loading task context",
      "analyzing requirements",
      "checking rules",
      "validating execution",
    ];

    for (const step of steps) {
      const event: AgentEvent = {
        taskId,
        agent,
        status: "running",
        message: `${agent}: ${step}`,
        timestamp: Date.now(),
      };

      this.emit(taskId, event);

      await this.sleep(400);
    }

    const finalEvent: AgentEvent = {
      taskId,
      agent,
      status: Math.random() > 0.2 ? "passed" : "warning",
      message: `${agent} completed execution`,
      timestamp: Date.now(),
    };

    this.emit(taskId, finalEvent);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// 🟢 SINGLETON (system-wide bus)
export const taskAgentStream = new TaskAgentStreamBinding();
type Severity = "low" | "medium" | "high" | "critical";

type SystemEvent = {
  type: string;
  message: string;
  severity: Severity;
  timestamp: number;
};

// 🟢 1. INPUT VALIDATION LAYER
export function validateTaskInput(task: any) {
  if (!task?.id || !task?.title) {
    throw new Error("Invalid Task (некорректная задача)");
  }

  if (task.title.length > 200) {
    throw new Error("Task title too long (слишком длинный заголовок)");
  }

  return true;
}

// 🟢 2. AGENT ISOLATION LAYER
export function isolateAgentExecution(agentFn: Function) {
  return async (...args: any[]) => {
    try {
      return await agentFn(...args);
    } catch (e) {
      return {
        status: "failed",
        error: "Agent isolated failure (ошибка агента изолирована)",
      };
    }
  };
}

// 🟢 3. EXECUTION GUARD
export function executionGuard(risk: Severity) {
  if (risk === "critical") {
    throw new Error("Execution blocked (выполнение заблокировано)");
  }

  return true;
}

// 🟢 4. MEMORY INTEGRITY CHECK
export function checkMemoryIntegrity(memory: any[]) {
  const valid = memory.every(
    (m) => m.taskId && m.decisions && m.createdAt
  );

  if (!valid) {
    throw new Error("Memory corruption detected (повреждение памяти)");
  }

  return true;
}

// 🟢 5. RATE LIMIT (simple v1)
const requestMap = new Map<string, number>();

export function rateLimit(key: string, limit = 10) {
  const count = requestMap.get(key) || 0;

  if (count > limit) {
    throw new Error("Rate limit exceeded (превышен лимит запросов)");
  }

  requestMap.set(key, count + 1);

  return true;
}

// 🟢 6. FAILURE RECOVERY
export async function safeExecute(fn: Function) {
  try {
    return await fn();
  } catch (e) {
    return {
      status: "recovered",
      message: "System recovered (система восстановлена)",
      error: String(e),
    };
  }
}

// 🟢 7. AUDIT LOGGER
export const auditLog: SystemEvent[] = [];

export function logEvent(event: SystemEvent) {
  auditLog.push(event);
}
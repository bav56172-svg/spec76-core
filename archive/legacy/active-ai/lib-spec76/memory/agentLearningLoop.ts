type AgentType = "QA" | "Safety" | "Compliance" | "DataIntegrity";

type DecisionStatus = "pass" | "fail" | "warning";

type AgentDecision = {
  taskId: string;
  agent: AgentType;
  status: DecisionStatus;
  reason: string;
  timestamp: number;
};

type MemoryRecord = {
  id: string;
  taskId: string;
  decisions: AgentDecision[];
  outcome: "success" | "failure";
  createdAt: number;
};

// 🟢 MEMORY STORE (in-memory v1, later DB)
const memoryStore: MemoryRecord[] = [];

// 🟢 SAVE EXECUTION RESULT
export function saveExecutionMemory(record: MemoryRecord) {
  memoryStore.push(record);
}

// 🟢 ANALYZE PATTERNS (learning core)
export function analyzeAgentPatterns() {
  const stats: Record<string, any> = {};

  for (const record of memoryStore) {
    for (const d of record.decisions) {
      if (!stats[d.agent]) {
        stats[d.agent] = {
          pass: 0,
          fail: 0,
          warning: 0,
        };
      }

      stats[d.agent][d.status]++;
    }
  }

  return stats;
}

// 🟢 RULE EVOLUTION ENGINE (simple v1)
export function evolveRules() {
  const patterns = analyzeAgentPatterns();

  const updatedRules: any[] = [];

  for (const agent in patterns) {
    const data = patterns[agent];

    // если слишком много ошибок → ужесточаем правила
    if (data.fail > data.pass) {
      updatedRules.push({
        agent,
        adjustment: "strict",
        reason: "high failure rate",
      });
    }

    // если всё стабильно → упрощаем проверки
    if (data.pass > data.fail * 3) {
      updatedRules.push({
        agent,
        adjustment: "relaxed",
        reason: "high success rate",
      });
    }
  }

  return updatedRules;
}

// 🟢 MAIN LOOP TRIGGER
export function runLearningLoop(record: MemoryRecord) {
  saveExecutionMemory(record);

  const newRules = evolveRules();

  return {
    stored: true,
    rulesUpdated: newRules,
  };
}
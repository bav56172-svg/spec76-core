type AgentDecision = {
  id: string;

  taskId: string;

  timestamp: number;

  input: any;

  aiOutput: any;

  agentResults: {
    qa: any;
    safety: any;
    compliance: any;
    dataIntegrity: any;
    audit: any;
  };

  finalVerdict: "approved" | "rejected" | "warning";

  confidence: number;
};

class AgentDecisionStore {
  private memory: AgentDecision[] = [];

  // 🟢 SAVE DECISION
  save(decision: AgentDecision) {
    this.memory.push(decision);
  }

  // 🟢 GET HISTORY FOR TASK
  getByTask(taskId: string) {
    return this.memory.filter((d) => d.taskId === taskId);
  }

  // 🟢 GET SIMILAR CASES (CORE INTELLIGENCE)
  findSimilar(input: any) {
    return this.memory.slice(-20); // simplified v1
  }

  // 🟢 ANALYZE SYSTEM PATTERN
  analyzePatterns() {
    return {
      totalDecisions: this.memory.length,
      approved: this.memory.filter((d) => d.finalVerdict === "approved").length,
      rejected: this.memory.filter((d) => d.finalVerdict === "rejected").length,
      avgConfidence:
        this.memory.reduce((acc, d) => acc + d.confidence, 0) /
        (this.memory.length || 1),
    };
  }
}

export const agentDecisionStore = new AgentDecisionStore();
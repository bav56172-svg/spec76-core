import { agentDecisionStore } from "../memory/agentDecisionStore";

type Rule = {
  id: string;
  agent: "qa" | "safety" | "compliance" | "dataIntegrity";
  condition: string;
  action: string;
  weight: number;
  successRate: number;
};

class RuleEvolutionEngine {
  private rules: Rule[] = [];

  // 🟢 INITIAL RULE SET
  init(defaultRules: Rule[]) {
    this.rules = defaultRules;
  }

  // 🟢 APPLY RULES TO DECISION
  applyRules(decision: any) {
    return this.rules.map((rule) => {
      return {
        ruleId: rule.id,
        applied: true,
        impact: rule.weight,
      };
    });
  }

  // 🟢 ANALYZE PERFORMANCE FROM MEMORY
  analyzeAndEvolve() {
    const history = agentDecisionStore.analyzePatterns();

    // 🧠 SIMPLE EVOLUTION LOGIC (v1)
    this.rules = this.rules.map((rule) => {
      const adjusted = { ...rule };

      if (history.rejected > history.approved) {
        adjusted.weight += 0.1; // tighten rules
      } else {
        adjusted.weight -= 0.05; // relax rules
      }

      adjusted.successRate =
        history.approved / (history.totalDecisions || 1);

      return adjusted;
    });

    return this.rules;
  }

  // 🟢 GET RULES
  getRules() {
    return this.rules;
  }
}

export const ruleEvolutionEngine = new RuleEvolutionEngine();
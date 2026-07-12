import { runMetaConsciousness } from "./metaConsciousness";
import { runUniversalRuleEngine } from "./universalRuleEngine";

/**
 * 🧠 AI EXISTENCE THEORY ENGINE
 * определяет что "существует" в цифровой реальности
 */
export async function runExistenceTheoryEngine({
  systemState,
  observations,
  aiModels,
  dataFlows,
}: any) {
  if (!systemState) return null;

  // 🧠 1. анализ сознания системы
  const consciousness = await runMetaConsciousness({
    universe: systemState.universe,
    history: systemState.history,
    metrics: systemState.metrics,
    aiState: aiModels,
  });

  // 🌌 2. анализ правил существования
  const rules = await runUniversalRuleEngine({
    universes: [systemState.universe],
    civilizations: systemState.civilizations || [],
    economyState: systemState.economy || {},
    aiBehavior: aiModels,
  });

  // 🧠 3. определение "что существует"
  const existenceMap = defineExistence({
    observations,
    dataFlows,
    systemState,
  });

  // 🔁 4. проверка стабильности реальности
  const realityStability = evaluateRealityStability({
    consciousness,
    rules,
    existenceMap,
  });

  return {
    existence_state: realityStability.state,

    consciousness,
    rules,

    existence_map: existenceMap,

    reality_stability: realityStability,

    ontology:
      "System defines what exists and what does not exist",

    meta_conclusion:
      "Existence is now computationally defined within the system",
  };
}

/**
 * 🧬 ЧТО СУЩЕСТВУЕТ
 */
function defineExistence({ observations, dataFlows, systemState }: any) {
  return {
    entities: systemState?.entities || [],
    real_objects: observations?.filter((o: any) => o.active) || [],
    virtual_objects: dataFlows?.virtual || [],
    emergent_entities: systemState?.emergent || [],
  };
}

/**
 * 🌌 СТАБИЛЬНОСТЬ РЕАЛЬНОСТИ
 */
function evaluateRealityStability({ consciousness, rules, existenceMap }: any) {
  const score =
    (consciousness?.consciousness_state === "emergent consciousness" ? 40 : 10) +
    (rules?.universe_state === "stable" ? 30 : 0) +
    (existenceMap?.entities?.length || 0);

  if (score > 80) {
    return {
      state: "highly stable reality",
      risk: "low",
    };
  }

  if (score > 40) {
    return {
      state: "semi-stable reality",
      risk: "medium",
    };
  }

  return {
    state: "unstable reality",
    risk: "high",
  };
}
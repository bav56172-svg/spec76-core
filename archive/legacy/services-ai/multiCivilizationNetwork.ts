import { runDigitalCivilization } from "./digitalCivilization";
import { runMarketSystem } from "./marketSystem";
import { runGovernanceLayer } from "./governance";

/**
 * 🌌 MULTI-CIVILIZATION NETWORK ENGINE
 * управляет несколькими цифровыми цивилизациями
 */
export async function runMultiCivilizationNetwork({
  civilizations,
  globalUsers,
  globalMarketData,
}: any) {
  if (!civilizations || civilizations.length === 0) {
    return null;
  }

  // 🌍 1. запускаем каждую цивилизацию отдельно
  const results = await Promise.all(
    civilizations.map(async (civ: any) => {
      return runDigitalCivilization({
        ecosystem: civ.ecosystem,
        globalUsers,
        globalUsage: globalMarketData?.usage || {},
        globalRevenue: globalMarketData?.revenue || {},
        policies: civ.policies || [],
      });
    })
  );

  // 🌐 2. анализ взаимодействий между цивилизациями
  const interMarket = await runMarketSystem({
    project: {
      title: "MULTI CIVILIZATION NETWORK",
      description: "Inter-civilization economy layer",
    },
    users: globalUsers,
    usageStats: globalMarketData,
    feedback: results,
  });

  // ⚖️ 3. глобальное управление всей сетью
  const governance = await runGovernanceLayer({
    project: {
      title: "MULTI CIVILIZATION NETWORK",
      description: "Global meta-governance layer",
    },
    swarmResult: results,
    autonomyResult: interMarket,
    selfModifyingResult: globalMarketData,
  });

  return {
    network_status: governance.system_status,

    civilizations: results,
    inter_civilization_market: interMarket,
    governance,

    summary:
      "Multi-Civilization Network fully simulated and evolving",
  };
}
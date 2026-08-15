import { runMarketSystem } from "./marketSystem";
import { runRevenueSystem } from "./revenueSystem";
import { runGovernanceLayer } from "./governance";
import { runAutonomousCompany } from "./autonomousCompany";

/**
 * 🌐 AI ECOSYSTEM ENGINE
 * управляет всеми продуктами, AI и рынками
 */
export async function runEcosystem({
  products,
  globalUsers,
  globalUsage,
  globalRevenue,
}: any) {
  if (!products) return null;

  // 🧠 1. анализ рынка всей экосистемы
  const marketAnalysis = await runMarketSystem({
    project: { title: "ECOSYSTEM", description: "Global AI Ecosystem" },
    users: globalUsers,
    usageStats: globalUsage,
    feedback: [],
  });

  // 💰 2. анализ дохода всей системы
  const revenueAnalysis = await runRevenueSystem({
    project: { title: "ECOSYSTEM", description: "Global AI Ecosystem" },
    users: globalUsers,
    usageStats: globalUsage,
    pricing: globalRevenue?.pricing || {},
    market: marketAnalysis,
  });

  // 🧠 3. автономные компании (каждый продукт)
  const companyResults = await Promise.all(
    products.map(async (p: any) => {
      return runAutonomousCompany(p);
    })
  );

  // ⚖️ 4. governance всей экосистемы
  const governance = await runGovernanceLayer({
    project: { title: "ECOSYSTEM", description: "Global Control Layer" },
    swarmResult: companyResults,
    autonomyResult: marketAnalysis,
    selfModifyingResult: revenueAnalysis,
  });

  return {
    ecosystem_status: governance.system_status,

    market: marketAnalysis,
    revenue: revenueAnalysis,
    companies: companyResults,
    governance,

    summary:
      "AI Ecosystem successfully evaluated and optimized",
  };
}
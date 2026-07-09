import { runGovernanceLayer } from "./governance";
import { runMarketSystem } from "./marketSystem";
import { runRevenueSystem } from "./revenueSystem";
import { runEcosystem } from "./ecosystem";
import { runAutonomousCompany } from "./autonomousCompany";

/**
 * 🌍 AI DIGITAL CIVILIZATION CORE ENGINE
 * управляет всей цифровой "страной" / системой
 */
export async function runDigitalCivilization({
  ecosystem,
  globalUsers,
  globalUsage,
  globalRevenue,
  policies,
}: any) {
  if (!ecosystem) return null;

  // 🧠 1. ЭВОЛЮЦИЯ ЭКОСИСТЕМЫ
  const ecosystemState = await runEcosystem({
    products: ecosystem.products,
    globalUsers,
    globalUsage,
    globalRevenue,
  });

  // 🌍 2. РЫНОК (экономика цивилизации)
  const market = await runMarketSystem({
    project: {
      title: "DIGITAL CIVILIZATION",
      description: "Global system economy",
    },
    users: globalUsers,
    usageStats: globalUsage,
    feedback: [],
  });

  // 💰 3. ЭКОНОМИКА (деньги цивилизации)
  const economy = await runRevenueSystem({
    project: {
      title: "DIGITAL CIVILIZATION",
      description: "Global economy layer",
    },
    users: globalUsers,
    usageStats: globalUsage,
    pricing: globalRevenue?.pricing || {},
    market,
  });

  // ⚖️ 4. ПРАВИТЕЛЬСТВО (governance AI)
  const government = await runGovernanceLayer({
    project: {
      title: "DIGITAL CIVILIZATION",
      description: "Civilization governance",
    },
    swarmResult: ecosystemState,
    autonomyResult: market,
    selfModifyingResult: economy,
  });

  // 🏗 5. ПОДСИСТЕМЫ (автономные компании)
  const companies = await Promise.all(
    ecosystem.products.map(async (p: any) => {
      return runAutonomousCompany(p);
    })
  );

  return {
    civilization_status: government.system_status,

    government,
    economy,
    market,
    ecosystem: ecosystemState,
    companies,

    policies: policies || [],

    summary:
      "AI Digital Civilization fully simulated and evolving",
  };
}
import { AIMultiCompanyEcosystem } from "@/lib/ecosystem/multiCompanyEcosystem";

/**
 * 🧠 AI DIGITAL CIVILIZATION LAYER
 * simulation of autonomous AI society
 */

type Resource = {
  type: string;
  value: number;
};

type Region = {
  id: string;
  stability: number;
  resources: Resource[];
};

export class AIDigitalCivilization {
  private ecosystem: AIMultiCompanyEcosystem;
  private regions: Region[] = [];

  constructor(ecosystem: AIMultiCompanyEcosystem) {
    this.ecosystem = ecosystem;

    /**
     * 🟢 INITIAL WORLD STATE
     */
    this.regions = [
      {
        id: "core-region",
        stability: 80,
        resources: [
          { type: "compute", value: 100 },
          { type: "data", value: 100 },
          { type: "capital", value: 100 },
        ],
      },
    ];
  }

  /**
   * 🚀 MAIN CIVILIZATION LOOP
   */
  async runTick() {
    /**
     * 🟢 STEP 1 — ECONOMY EVOLUTION
     */
    const companies = await this.ecosystem.runCycle();

    /**
     * 🟢 STEP 2 — RESOURCE DISTRIBUTION
     */
    this.distributeResources(companies);

    /**
     * 🟢 STEP 3 — CIVILIZATION STABILITY CHECK
     */
    this.updateStability();

    /**
     * 🟢 STEP 4 — EMERGENT COMPANY CREATION
     */
    this.spawnNewCompanies(companies);

    /**
     * 🟢 STEP 5 — WORLD EVOLUTION
     */
    this.evolveWorld();

    return {
      companies,
      regions: this.regions,
    };
  }

  /**
   * 🧠 RESOURCE DISTRIBUTION ENGINE
   */
  private distributeResources(companies: any[]) {
    for (const region of this.regions) {
      for (const resource of region.resources) {
        /**
         * 🟢 HIGH PERFORMANCE COMPANIES GET MORE RESOURCES
         */
        const topCompany = companies[0];

        if (topCompany) {
          resource.value += topCompany.performance > 70 ? 10 : -5;
        }
      }
    }
  }

  /**
   * 📊 STABILITY SYSTEM
   */
  private updateStability() {
    for (const region of this.regions) {
      const resourceBalance = region.resources.reduce(
        (sum, r) => sum + r.value,
        0
      );

      if (resourceBalance > 300) {
        region.stability += 5;
      } else {
        region.stability -= 5;
      }

      /**
       * clamp
       */
      region.stability = Math.max(
        0,
        Math.min(100, region.stability)
      );
    }
  }

  /**
   * 🧠 EMERGENT COMPANY SPAWN
   */
  private spawnNewCompanies(companies: any[]) {
    const avgPerformance =
      companies.reduce((a, b) => a + b.performance, 0) /
      (companies.length || 1);

    /**
     * 🟢 IF ECONOMY IS STRONG → NEW ENTITIES EMERGE
     */
    if (avgPerformance > 75) {
      console.log("🟢 NEW COMPANY EMERGED IN CIVILIZATION");
    }
  }

  /**
   * 🌍 WORLD EVOLUTION ENGINE
   */
  private evolveWorld() {
    for (const region of this.regions) {
      /**
       * natural drift
       */
      region.stability += Math.random() > 0.5 ? 1 : -1;

      region.stability = Math.max(
        0,
        Math.min(100, region.stability)
      );
    }
  }

  /**
   * 📊 GET CIVILIZATION STATE
   */
  getState() {
    return {
      regions: this.regions,
      ecosystem: this.ecosystem.getMarketState(),
      timestamp: Date.now(),
    };
  }
}
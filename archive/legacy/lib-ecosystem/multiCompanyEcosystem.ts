import { AIAutonomousCompany } from "@/lib/company/autonomousCompany";
import { AICostOptimizationEngine } from "@/lib/ai/costOptimizationEngine";

/**
 * 🧠 AI MULTI-COMPANY ECOSYSTEM
 * ecosystem of competing autonomous AI companies
 */

type Company = {
  id: string;
  name: string;
  capital: number;
  performance: number;
};

export class AIMultiCompanyEcosystem {
  private companies: Company[] = [];

  /**
   * 🚀 INIT ECOSYSTEM
   */
  constructor(seedCompanies: Company[]) {
    this.companies = seedCompanies;
  }

  /**
   * 🟢 MAIN ECOSYSTEM LOOP
   */
  async runCycle() {
    /**
     * 1. EACH COMPANY EXECUTES AUTONOMOUSLY
     */
    const results = await Promise.all(
      this.companies.map((company) =>
        this.runCompany(company)
      )
    );

    /**
     * 2. MARKET BALANCING
     */
    this.balanceMarket(results);

    /**
     * 3. COMPETITION SCORING
     */
    this.scoreCompanies();

    /**
     * 4. EVOLUTION STEP
     */
    this.evolveCompanies();

    return this.companies;
  }

  /**
   * 🧠 RUN SINGLE COMPANY
   */
  private async runCompany(company: Company) {
    const result = await AIAutonomousCompany.run(company.id);

    const optimized =
      await AICostOptimizationEngine.optimize(
        { projectId: company.id, tasks: [], memory: [] },
        result.actions || []
      );

    return {
      company,
      result,
      optimized,
    };
  }

  /**
   * 📊 MARKET BALANCING ENGINE
   */
  private balanceMarket(results: any[]) {
    for (const r of results) {
      const performance = r.result?.growth?.metrics?.retention || 50;

      const company = this.companies.find(
        (c) => c.id === r.company.id
      );

      if (!company) continue;

      /**
       * 🟢 CAPITAL ADJUSTMENT
       */
      company.capital += performance > 70 ? 100 : -20;

      company.performance = performance;
    }
  }

  /**
   * 🧠 COMPETITION SCORING
   */
  private scoreCompanies() {
    this.companies.sort(
      (a, b) => b.performance - a.performance
    );
  }

  /**
   * 🚀 EVOLUTION ENGINE
   */
  private evolveCompanies() {
    for (const company of this.companies) {
      /**
       * 🟢 HIGH PERFORMERS SCALE FASTER
       */
      if (company.performance > 80) {
        company.capital *= 1.2;
      }

      /**
       * 🔴 LOW PERFORMERS SHRINK
       */
      if (company.performance < 40) {
        company.capital *= 0.8;
      }
    }
  }

  /**
   * 📊 GET MARKET STATE
   */
  getMarketState() {
    return {
      companies: this.companies,
      leader: this.companies[0],
      totalCompanies: this.companies.length,
    };
  }
}
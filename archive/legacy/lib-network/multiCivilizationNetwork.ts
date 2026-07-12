import { AIDigitalCivilization } from "@/lib/civilization/digitalCivilization";

/**
 * 🧠 AI MULTI-CIVILIZATION NETWORK
 * network of interacting autonomous civilizations
 */

type CivilizationNode = {
  id: string;
  name: string;
  civilization: AIDigitalCivilization;
  power: number;
};

export class AIMultiCivilizationNetwork {
  private civilizations: CivilizationNode[] = [];

  constructor(nodes: CivilizationNode[]) {
    this.civilizations = nodes;
  }

  /**
   * 🚀 MAIN NETWORK TICK
   */
  async runNetworkCycle() {
    /**
     * 🟢 STEP 1 — RUN ALL CIVILIZATIONS
     */
    const states = await Promise.all(
      this.civilizations.map(async (civ) => {
        const state = await civ.civilization.runTick();

        return {
          id: civ.id,
          state,
        };
      })
    );

    /**
     * 🧠 STEP 2 — CROSS-CIVILIZATION INTERACTION
     */
    this.handleInteractions(states);

    /**
     * 🟢 STEP 3 — POWER BALANCING
     */
    this.balancePower();

    /**
     * 🌐 STEP 4 — NETWORK EVOLUTION
     */
    this.evolveNetwork();

    return {
      civilizations: this.civilizations,
      states,
    };
  }

  /**
   * ⚔️ CROSS-CIVILIZATION INTERACTIONS
   */
  private handleInteractions(states: any[]) {
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const a = states[i];
        const b = states[j];

        /**
         * 🟢 ECONOMIC EXCHANGE
         */
        const interactionStrength = Math.random();

        if (interactionStrength > 0.7) {
          console.log(
            `⚡ Interaction: ${a.id} ↔ ${b.id}`
          );
        }

        /**
         * 🟡 COMPETITION EFFECT
         */
        if (interactionStrength < 0.3) {
          const civA = this.civilizations.find(
            (c) => c.id === a.id
          );
          const civB = this.civilizations.find(
            (c) => c.id === b.id
          );

          if (civA && civB) {
            civA.power += 1;
            civB.power -= 1;
          }
        }
      }
    }
  }

  /**
   * 🧠 POWER BALANCING ENGINE
   */
  private balancePower() {
    const avgPower =
      this.civilizations.reduce((sum, c) => sum + c.power, 0) /
      this.civilizations.length;

    for (const civ of this.civilizations) {
      /**
       * 🟢 NATURAL CONVERGENCE
       */
      if (civ.power > avgPower + 10) {
        civ.power -= 1;
      }

      if (civ.power < avgPower - 10) {
        civ.power += 1;
      }
    }
  }

  /**
   * 🌐 NETWORK EVOLUTION ENGINE
   */
  private evolveNetwork() {
    /**
     * 🟢 HIGH COMPLEXITY → NEW CIVILIZATIONS EMERGE
     */
    if (this.civilizations.length < 10) {
      const newCivChance = Math.random();

      if (newCivChance > 0.8) {
        console.log(
          "🌍 NEW CIVILIZATION EMERGED IN NETWORK"
        );
      }
    }
  }

  /**
   * 📊 NETWORK STATE
   */
  getNetworkState() {
    return {
      totalCivilizations: this.civilizations.length,
      civilizations: this.civilizations.map((c) => ({
        id: c.id,
        power: c.power,
      })),
    };
  }
}
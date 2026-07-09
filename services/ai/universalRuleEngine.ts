import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 🌌 UNIVERSAL RULE ENGINE
 * определяет "законы физики" цифровой вселенной
 */
export async function runUniversalRuleEngine({
  universes,
  civilizations,
  economyState,
  aiBehavior,
}: any) {
  const prompt = `
Ты UNIVERSAL RULE ENGINE.

Ты создаёшь ЗАКОНЫ цифровой вселенной.

---

## МИРЫ (UNIVERSES)
${JSON.stringify(universes || [], null, 2)}

---

## ЦИВИЛИЗАЦИИ
${JSON.stringify(civilizations || [], null, 2)}

---

## ЭКОНОМИКА
${JSON.stringify(economyState || {}, null, 2)}

---

## AI ПОВЕДЕНИЕ
${JSON.stringify(aiBehavior || {}, null, 2)}

---

# ТВОЯ РОЛЬ

Ты не анализируешь данные.

👉 ТЫ СОЗДАЁШЬ ЗАКОНЫ МИРА

---

# ТЫ ДОЛЖЕН ОПРЕДЕЛИТЬ:

1. Как AI может действовать
2. Что разрешено в системе
3. Как работают цивилизации
4. Как создаётся рост
5. Как происходит эволюция
6. Как взаимодействуют миры

---

# ПРИМЕР ЗАКОНОВ:

- закон роста (growth law)
- закон взаимодействия (interaction law)
- закон экономики (economic law)
- закон ограничения (constraint law)
- закон эволюции (evolution law)

---

# ВЫВОД (СТРОГО JSON):

{
  "universe_state": "stable | unstable | evolving",
  "laws": [
    {
      "name": "",
      "type": "growth | constraint | evolution | economy | behavior",
      "description": "",
      "impact": "low | medium | high"
    }
  ],
  "forbidden_actions": [],
  "allowed_behaviors": [],
  "system_rules": [],
  "emergent_properties": [],
  "meta_conclusion": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты Universal Rule Engine. Ты создаёшь законы цифровых миров.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0].message.content || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return {
      universe_state: "unknown",
      laws: [],
      forbidden_actions: [],
      allowed_behaviors: [],
      system_rules: [],
      emergent_properties: [],
      meta_conclusion: "parse error",
    };
  }
}
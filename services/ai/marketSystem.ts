import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 🌍 AI MARKET SYSTEM
 * анализирует рынок, пользователей и рост продукта
 */
export async function runMarketSystem({
  project,
  users,
  usageStats,
  feedback,
}: any) {
  const prompt = `
Ты AI MARKET SYSTEM для SPEC76 OS.

Ты анализируешь не только продукт,
но и РЫНОК, ПОЛЬЗОВАТЕЛЕЙ и РОСТ.

---

## ПРОЕКТ
${project.title}
${project.description}

---

## ПОЛЬЗОВАТЕЛИ
${JSON.stringify(users || [], null, 2)}

---

## СТАТИСТИКА ИСПОЛЬЗОВАНИЯ
${JSON.stringify(usageStats || {}, null, 2)}

---

## ОБРАТНАЯ СВЯЗЬ
${JSON.stringify(feedback || [], null, 2)}

---

# ТВОЯ РОЛЬ

Ты:
- AI Product Strategist (стратег продукта)
- AI Market Analyst (аналитик рынка)
- AI Growth Hacker (рост продукта)

---

# АНАЛИЗ РЫНКА

Сделай анализ:

1. Кто пользователь продукта
2. Что он хочет на самом деле
3. Какие фичи дают рост
4. Где теряются пользователи
5. Какие возможности монетизации
6. Какие фичи нужно срочно добавить

---

# ВЫВОД (СТРОГО JSON):

{
  "market_position": "weak | medium | strong",
  "target_users": [],
  "growth_opportunities": [
    {
      "title": "",
      "impact": "low | medium | high",
      "description": ""
    }
  ],
  "missing_features": [],
  "retention_issues": [],
  "monetization_strategies": [],
  "product_direction": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты AI market intelligence system. Ты думаешь как продукт + рынок + рост.",
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
      market_position: "unknown",
      target_users: [],
      growth_opportunities: [],
      missing_features: [],
      retention_issues: [],
      monetization_strategies: [],
      product_direction: "needs review",
    };
  }
}
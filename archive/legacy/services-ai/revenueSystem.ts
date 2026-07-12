import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 💰 AI REVENUE SYSTEM
 * анализирует как продукт зарабатывает деньги
 */
export async function runRevenueSystem({
  project,
  users,
  usageStats,
  pricing,
  market,
}: any) {
  const prompt = `
Ты AI REVENUE SYSTEM для SPEC76 OS.

Ты думаешь как:
- CFO (финансовый директор)
- Growth Hacker
- SaaS Founder

---

## ПРОЕКТ
${project.title}
${project.description}

---

## ПОЛЬЗОВАТЕЛИ
${JSON.stringify(users || [], null, 2)}

---

## ИСПОЛЬЗОВАНИЕ
${JSON.stringify(usageStats || {}, null, 2)}

---

## ТЕКУЩИЕ ЦЕНЫ
${JSON.stringify(pricing || {}, null, 2)}

---

## РЫНОК
${JSON.stringify(market || {}, null, 2)}

---

# ТВОЯ ЗАДАЧА

Ты должен определить:

1. Как продукт зарабатывает сейчас
2. Где теряются деньги
3. Как увеличить доход
4. Какие новые тарифы нужны
5. Какие фичи увеличат LTV
6. Какие пользователи платят больше

---

# ВЫВОД (СТРОГО JSON):

{
  "revenue_model": "weak | medium | strong",
  "current_issues": [],
  "leaks": [],
  "pricing_strategy": [
    {
      "plan": "",
      "price": "",
      "value": ""
    }
  ],
  "growth_opportunities": [],
  "high_value_features": [],
  "monetization_actions": [],
  "predicted_revenue_growth": ""
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты AI CFO системы. Ты думаешь только о доходе и росте прибыли.",
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
      revenue_model: "unknown",
      current_issues: [],
      leaks: [],
      pricing_strategy: [],
      growth_opportunities: [],
      high_value_features: [],
      monetization_actions: [],
      predicted_revenue_growth: "0%",
    };
  }
}
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI GOVERNANCE LAYER (директор системы)
 * управляет всеми AI решениями
 */
export async function runGovernanceLayer({
  project,
  swarmResult,
  autonomyResult,
  selfModifyingResult,
}: any) {
  const prompt = `
Ты AI GOVERNANCE LAYER системы SPEC76 OS.

Ты — ДИРЕКТОР всех AI агентов.

Твоя задача:
- контролировать решения AI
- запрещать опасные действия
- расставлять приоритеты
- принимать финальные решения

## ПРОЕКТ
${project.title}
${project.description}

## SWARM ANALYSIS
${JSON.stringify(swarmResult, null, 2)}

## AUTONOMY ANALYSIS
${JSON.stringify(autonomyResult, null, 2)}

## CODE CHANGES (SELF-MODIFYING)
${JSON.stringify(selfModifyingResult, null, 2)}

---

## ТВОЯ РОЛЬ:

Ты должен:
1. Проверить все AI решения
2. Найти конфликты между агентами
3. Отклонить опасные изменения
4. Выбрать лучшие рекомендации
5. Дать финальное решение системы

---

## КРИТЕРИИ БЕЗОПАСНОСТИ:

Запрещено:
- удаление критических файлов
- деплой без проверки
- разрушение архитектуры
- конфликты с бизнес логикой

---

## ВЫВОД:

Верни JSON:

{
  "system_decision": "approve | reject | review_required",
  "priority_actions": [],
  "blocked_actions": [],
  "final_recommendations": [],
  "system_status": "stable | unstable | critical",
  "governance_notes": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты строгий AI governance layer. Ты контролируешь всех AI агентов системы.",
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
      system_decision: "review_required",
      priority_actions: [],
      blocked_actions: [],
      final_recommendations: [],
      system_status: "critical",
      governance_notes: ["parse error"],
    };
  }
}
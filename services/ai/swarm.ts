import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type AgentRole = "architect" | "developer" | "pm" | "critic";

async function runAgent(role: AgentRole, project: any) {
  const prompts = {
    architect: `
Ты AI Architect (архитектор системы).
Твоя задача: структура, масштабирование, архитектура.
Думай как senior system designer.
`,

    developer: `
Ты AI Developer (разработчик).
Твоя задача: код, баги, реализация.
Думай как senior fullstack engineer.
`,

    pm: `
Ты AI Product Manager.
Твоя задача: продукт, UX, бизнес логика.
Думай как founder.
`,

    critic: `
Ты AI Critic (критик системы).
Твоя задача: найти ошибки, уязвимости, слабые места.
Будь максимально строгим.
`,
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: prompts[role],
      },
      {
        role: "user",
        content: `
Проект:
Название: ${project.title}
Описание: ${project.description}

Дай анализ в JSON:
{
  "role": "${role}",
  "insights": [],
  "recommendations": []
}
        `,
      },
    ],
  });

  const text = response.choices[0].message.content || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return {
      role,
      insights: [],
      recommendations: [],
    };
  }
}

/**
 * AI SWARM ORCHESTRATOR
 */
export async function runSwarm(project: any) {
  const [architect, developer, pm, critic] = await Promise.all([
    runAgent("architect", project),
    runAgent("developer", project),
    runAgent("pm", project),
    runAgent("critic", project),
  ]);

  return {
    summary: "AI Swarm analysis completed",
    agents: {
      architect,
      developer,
      pm,
      critic,
    },
    merged_insights: [
      ...architect.insights,
      ...developer.insights,
      ...pm.insights,
      ...critic.insights,
    ],
    merged_recommendations: [
      ...architect.recommendations,
      ...developer.recommendations,
      ...pm.recommendations,
      ...critic.recommendations,
    ],
  };
}
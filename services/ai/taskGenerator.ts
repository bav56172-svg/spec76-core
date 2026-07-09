import { Project } from "@/types/project";
import { Task } from "@/types/task";

/**
 * AI GENERATOR (имитация интеллекта)
 * позже заменим на OpenAI / GPT API
 */
export function generateTasksFromProject(project: Project | null): Omit<Task, "id" | "created_at" | "updated_at">[] {
  if (!project) return [];

  const tasks: Omit<Task, "id" | "created_at" | "updated_at">[] = [];

  // 🧠 ANALYSIS (анализ проекта)
  const title = project.title?.toLowerCase() || "";

  // 📦 LOGIC 1 — базовые задачи для любого проекта
  tasks.push({
    title: "Определить цель проекта",
    description: "Сформулировать ключевую цель и результат",
    status: "todo",
    project_id: project.id,
  });

  tasks.push({
    title: "Создать структуру проекта",
    description: "Разбить проект на логические блоки",
    status: "todo",
    project_id: project.id,
  });

  // 🧠 LOGIC 2 — если это строительный / бизнес проект
  if (title.includes("стро") || title.includes("build")) {
    tasks.push({
      title: "Составить план работ",
      description: "Этапы выполнения проекта",
      status: "todo",
      project_id: project.id,
    });

    tasks.push({
      title: "Определить ресурсы",
      description: "Материалы, люди, бюджет",
      status: "todo",
      project_id: project.id,
    });
  }

  // 🧠 LOGIC 3 — IT / software проекты
  if (title.includes("app") || title.includes("os") || title.includes("platform")) {
    tasks.push({
      title: "Спроектировать архитектуру",
      description: "UI, backend, data layer",
      status: "todo",
      project_id: project.id,
    });

    tasks.push({
      title: "Создать MVP",
      description: "Первая рабочая версия продукта",
      status: "todo",
      project_id: project.id,
    });
  }

  return tasks;
}
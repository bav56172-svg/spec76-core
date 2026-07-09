import { Project } from "@/types/project";

export function analyzeProject(project: Project | null) {
  if (!project) {
    return {
      status: "empty",
      message: "Проект не найден",
      suggestions: ["Создать новый проект"],
    };
  }

  const issues: string[] = [];
  const suggestions: string[] = [];

  // 🔍 ANALYSIS (анализ)

  if (!project.description) {
    issues.push("Нет описания проекта");
    suggestions.push("Добавить описание проекта");
  }

  if (project.status === "draft") {
    suggestions.push("Перевести проект в активный статус");
  }

  return {
    status: "analyzed",
    project,
    issues,
    suggestions,
  };
}
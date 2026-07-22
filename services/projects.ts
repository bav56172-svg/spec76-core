import {
  databaseFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ServiceResult } from "@/types/service-result";
import type {
  Project,
  ProjectActivityItem,
  ProjectExecutionWorkspace,
  ProjectTaskMetrics,
  ProjectTaskSummary,
  ProjectWorkspace,
} from "@/types/project";

const PROJECT_WORKSPACE_SELECT = `
  *,
  request:requests(id, title, description, city, status),
  accepted_offer:offers(id, price, currency, proposed_days, message, status),
  company:companies(id, name, city, phone, email)
`;

function buildTaskMetrics(tasks: ProjectTaskSummary[]): ProjectTaskMetrics {
  const count = (status: ProjectTaskSummary["status"]) =>
    tasks.filter((task) => task.status === status).length;
  const activeTotal = tasks.filter((task) => task.status !== "cancelled").length;
  const done = count("done");

  return {
    total: tasks.length,
    todo: count("todo"),
    in_progress: count("in_progress"),
    review: count("review"),
    done,
    cancelled: count("cancelled"),
    completion_percent: activeTotal === 0 ? 0 : Math.round((done / activeTotal) * 100),
  };
}

function buildActivity(
  project: ProjectWorkspace,
  tasks: ProjectTaskSummary[],
): ProjectActivityItem[] {
  const items: ProjectActivityItem[] = [
    {
      id: `project-created-${project.id}`,
      title: "Проект создан",
      description: "Принятое предложение преобразовано в проект выполнения.",
      created_at: project.created_at,
    },
  ];

  if (project.accepted_offer) {
    items.push({
      id: `offer-accepted-${project.accepted_offer.id}`,
      title: "Исполнитель выбран",
      description: `Принято предложение на ${project.accepted_offer.price.toLocaleString("ru-RU")} ₽.`,
      created_at: project.created_at,
    });
  }

  for (const task of tasks) {
    items.push({
      id: `task-${task.id}-${task.status}`,
      title: task.status === "done" ? "Задача завершена" : "Задача обновлена",
      description: task.title,
      created_at: task.updated_at,
    });
  }

  return items.sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export async function getProject(
  id: string,
): Promise<ServiceResult<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (error) {
    return databaseFailure(error, "Не удалось получить проект.");
  }

  return serviceSuccess(data);
}

export async function getProjectWorkspace(
  id: string,
): Promise<ServiceResult<ProjectWorkspace>> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_WORKSPACE_SELECT)
    .eq("id", id)
    .single<ProjectWorkspace>();

  if (error) {
    return databaseFailure(
      error,
      "Не удалось получить рабочее пространство проекта.",
    );
  }

  return serviceSuccess(data);
}

export async function getProjectExecutionWorkspace(
  id: string,
): Promise<ServiceResult<ProjectExecutionWorkspace>> {
  const [projectResult, tasksResult] = await Promise.all([
    getProjectWorkspace(id),
    supabase
      .from("tasks")
      .select("id, title, status, position, created_at, updated_at")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .returns<ProjectTaskSummary[]>(),
  ]);

  if (projectResult.error) {
    return projectResult;
  }

  if (tasksResult.error) {
    return databaseFailure(
      tasksResult.error,
      "Не удалось получить задачи проекта.",
    );
  }

  const tasks = tasksResult.data ?? [];
  const data: ProjectExecutionWorkspace = {
    ...projectResult.data,
    tasks,
    task_metrics: buildTaskMetrics(tasks),
    activity: buildActivity(projectResult.data, tasks),
  };

  return serviceSuccess(data);
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single<Project>();

  if (error) {
    return databaseFailure(error, "Не удалось создать проект.");
  }

  return serviceSuccess(data);
}

export async function getProjects(
  companyId: string,
): Promise<ServiceResult<Project[]>> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  if (error) {
    return databaseFailure(error, "Не удалось получить проекты.");
  }

  return serviceSuccess(data ?? []);
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
): Promise<ServiceResult<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single<Project>();

  if (error) {
    return databaseFailure(error, "Не удалось обновить проект.");
  }

  return serviceSuccess(data);
}

export async function deleteProject(
  id: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return databaseFailure(error, "Не удалось удалить проект.");
  }

  return serviceSuccess(null);
}

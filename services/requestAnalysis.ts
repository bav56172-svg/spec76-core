import { supabase } from "@/services/supabase";
import type { Request } from "@/types/request";
import type {
  RequestAnalysis,
  RequestAnalysisDraft,
} from "@/types/request-analysis";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function analyzeRequestLocally(request: Request): RequestAnalysisDraft {
  const text = `${request.title} ${request.description}`.toLowerCase();
  const services: string[] = [];
  const equipment: string[] = [];
  const materials: string[] = [];
  const clarifications: string[] = [];

  if (includesAny(text, ["снег", "снеж", "очистить территорию"])) {
    services.push("Уборка снега");
    equipment.push("Фронтальный погрузчик");
    if (includesAny(text, ["вывезти", "вывоз"])) {
      services.push("Вывоз снега");
      equipment.push("Самосвал");
    } else {
      clarifications.push("Нужно ли вывозить снег с территории?");
    }
  }

  if (includesAny(text, ["мусор", "отход", "демонтаж"])) {
    services.push("Вывоз строительного мусора");
    equipment.push("Самосвал");
    equipment.push("Погрузчик");
  }

  if (includesAny(text, ["котлован", "копать", "транше", "грунт"])) {
    services.push("Земляные работы");
    equipment.push("Экскаватор");
  }

  if (includesAny(text, ["песок", "щебень", "отсев"])) {
    services.push("Доставка сыпучих материалов");
    equipment.push("Самосвал");
    if (text.includes("песок")) materials.push("Песок");
    if (text.includes("щебень")) materials.push("Щебень");
    if (text.includes("отсев")) materials.push("Отсев");
  }

  const areaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м2|м²|кв(?:адратных)?\s*метр)/i);
  const volumeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м3|м³|куб(?:ов|ических\s*метр)?)/i);
  const estimatedScope = areaMatch
    ? `${areaMatch[1].replace(",", ".")} м²`
    : volumeMatch
      ? `${volumeMatch[1].replace(",", ".")} м³`
      : null;

  if (!estimatedScope) {
    clarifications.push("Какой ориентировочный объём или площадь работ?");
  }
  if (!request.location_text) {
    clarifications.push("Уточните адрес или ориентир места выполнения работ.");
  }
  if (services.length === 0) {
    services.push("Требуется ручная классификация");
    clarifications.push("Какой результат должен быть получен после выполнения работ?");
  }

  const confidence = Math.min(
    0.98,
    0.45 + services.length * 0.12 + equipment.length * 0.07 + (estimatedScope ? 0.12 : 0),
  );

  return {
    services: unique(services),
    equipment: unique(equipment),
    materials: unique(materials),
    estimated_scope: estimatedScope,
    confidence: Number(confidence.toFixed(2)),
    clarifications: unique(clarifications),
    status: clarifications.length > 0 ? "needs_clarification" : "completed",
  };
}

export async function getCurrentRequestAnalysis(requestId: string) {
  return await supabase
    .from("request_analyses")
    .select("*")
    .eq("request_id", requestId)
    .eq("is_current", true)
    .maybeSingle<RequestAnalysis>();
}

export async function runRequestAnalysis(request: Request) {
  const analysis = analyzeRequestLocally(request);

  const { error: resetError } = await supabase
    .from("request_analyses")
    .update({ is_current: false })
    .eq("request_id", request.id)
    .eq("is_current", true);

  if (resetError) {
    return { data: null, error: resetError };
  }

  return await supabase
    .from("request_analyses")
    .insert({
      request_id: request.id,
      ...analysis,
      is_current: true,
    })
    .select("*")
    .single<RequestAnalysis>();
}

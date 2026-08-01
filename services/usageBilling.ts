import {
  databaseFailure,
  serviceFailure,
  serviceSuccess,
} from "@/services/serviceResult";
import { supabase } from "@/services/supabase";
import type { ServiceResult } from "@/types/service-result";

interface AiUsageRow {
  count: number;
}

export class UsageBilling {
  static getLimit(plan: string): number {
    switch (plan) {
      case "free":
        return 100;
      case "pro":
        return 1000;
      case "enterprise":
        return 10000;
      default:
        return 50;
    }
  }

  static async canUse(
    userId: string,
    plan: string,
  ): Promise<ServiceResult<boolean>> {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("count")
      .eq("user_id", userId)
      .maybeSingle<AiUsageRow>();

    if (error) {
      return databaseFailure(
        error,
        "Не удалось проверить лимит использования ИИ.",
      );
    }

    const usage = data?.count ?? 0;
    const limit = this.getLimit(plan);

    return serviceSuccess(usage < limit);
  }

  static async track(
    userId: string,
    type: string,
  ): Promise<ServiceResult<never>> {
    void userId;
    void type;

    return serviceFailure(
      "CONFLICT",
      "Учёт использования ИИ требует атомарной серверной операции. Возможность будет включена в AI API Recovery.",
    );
  }
}

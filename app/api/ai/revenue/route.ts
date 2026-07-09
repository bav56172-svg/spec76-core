import { runRevenueSystem } from "@/services/ai/revenueSystem";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runRevenueSystem(body);

  return Response.json(result);
}
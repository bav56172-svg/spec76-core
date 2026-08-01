import { runUniversalRuleEngine } from "@/services/ai/universalRuleEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runUniversalRuleEngine(body);

  return Response.json(result);
}
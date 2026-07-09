import { runMarketSystem } from "@/services/ai/marketSystem";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runMarketSystem(body);

  return Response.json(result);
}
import { runMultiCivilizationNetwork } from "@/services/ai/multiCivilizationNetwork";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runMultiCivilizationNetwork(body);

  return Response.json(result);
}
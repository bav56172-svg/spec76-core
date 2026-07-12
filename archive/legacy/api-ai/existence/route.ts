import { runExistenceTheoryEngine } from "@/services/ai/existenceTheoryEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runExistenceTheoryEngine(body);

  return Response.json(result);
}
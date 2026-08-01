import { runEcosystem } from "@/services/ai/ecosystem";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runEcosystem(body);

  return Response.json(result);
}
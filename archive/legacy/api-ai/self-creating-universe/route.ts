import { runSelfCreatingUniverse } from "@/services/ai/selfCreatingUniverse";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runSelfCreatingUniverse(body);

  return Response.json(result);
}
import { runAutoDeploy } from "@/services/ai/autoDeploy";

export async function POST(req: Request) {
  const body = await req.json();

  const patches = body.patches;

  const result = await runAutoDeploy(patches);

  return Response.json(result);
}
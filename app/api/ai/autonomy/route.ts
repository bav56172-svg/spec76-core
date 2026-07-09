import { runAutonomyEngine } from "@/services/ai/autonomy";

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;

  const result = await runAutonomyEngine(project);

  return Response.json(result);
}
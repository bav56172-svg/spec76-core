import { runSwarm } from "@/services/ai/swarm";

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;

  const result = await runSwarm(project);

  return Response.json(result);
}
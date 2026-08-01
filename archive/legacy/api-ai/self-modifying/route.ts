import { runSelfModifyingAI } from "@/services/ai/selfModifying";

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;
  const codebase = body.codebase;

  const result = await runSelfModifyingAI(project, codebase);

  return Response.json(result);
}
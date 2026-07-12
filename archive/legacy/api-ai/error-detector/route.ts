import { runErrorDetector } from "@/services/ai/errorDetector";

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;

  const result = await runErrorDetector(project);

  return Response.json(result);
}
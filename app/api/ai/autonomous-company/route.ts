import { runAutonomousCompany } from "@/services/ai/autonomousCompany";

export async function POST(req: Request) {
  const body = await req.json();

  const project = body.project;

  const result = await runAutonomousCompany(project);

  return Response.json(result);
}
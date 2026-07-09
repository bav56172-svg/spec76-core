import { runDigitalCivilization } from "@/services/ai/digitalCivilization";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runDigitalCivilization(body);

  return Response.json(result);
}
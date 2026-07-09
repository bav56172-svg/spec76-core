import { runMetaConsciousness } from "@/services/ai/metaConsciousness";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await runMetaConsciousness(body);

  return Response.json(result);
}
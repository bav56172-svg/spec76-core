import { runGovernanceLayer } from "@/services/ai/governance";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    project,
    swarmResult,
    autonomyResult,
    selfModifyingResult,
  } = body;

  const result = await runGovernanceLayer({
    project,
    swarmResult,
    autonomyResult,
    selfModifyingResult,
  });

  return Response.json(result);
}
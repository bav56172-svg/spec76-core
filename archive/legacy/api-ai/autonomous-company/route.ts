import type { NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { runAutonomousCompany } from "@/services/ai/autonomousCompany";

async function authorizeProjectAccess(
  request: NextRequest,
  projectId: string,
): Promise<Response | null> {
  const { supabase } = createMiddlewareClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: canAccess, error: accessError } = await supabase.rpc(
    "can_access_project",
    { target_project_id: projectId },
  );

  if (accessError || canAccess !== true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const project = body.project;

  if (!project || typeof project.id !== "string") {
    return Response.json({ error: "Valid project.id is required" }, { status: 400 });
  }

  const authorizationError = await authorizeProjectAccess(req, project.id);

  if (authorizationError) {
    return authorizationError;
  }

  const result = await runAutonomousCompany(project);

  return Response.json(result);
}

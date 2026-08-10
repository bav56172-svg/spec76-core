export async function POST() {
  return Response.json(
    {
      error: "Forbidden",
      message: "AI auto-deploy is disabled until platform admin authorization is implemented.",
    },
    {
      status: 403,
    },
  );
}

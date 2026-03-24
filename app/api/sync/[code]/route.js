import { getSyncSnapshot, saveSyncSnapshot } from "@/lib/sync-store";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function GET(_request, { params }) {
  const code = normalizeCode(params.code);
  const record = getSyncSnapshot(code);

  if (!record) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(record);
}

export async function PUT(request, { params }) {
  const code = normalizeCode(params.code);
  const body = await request.json();

  if (!code || !body?.state) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const record = saveSyncSnapshot(code, body.state);
  return Response.json(record);
}

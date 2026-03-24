import { getSyncSnapshot, saveSyncSnapshot } from "@/lib/sync-store";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function GET(_request, { params }) {
  try {
    const code = normalizeCode(params.code);
    const record = await getSyncSnapshot(code);

    if (!record) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error.message || "Sync fetch failed" }, { status: 503 });
  }
}

export async function PUT(request, { params }) {
  try {
    const code = normalizeCode(params.code);
    const body = await request.json();

    if (!code || !body?.state) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const record = await saveSyncSnapshot(code, body.state);
    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error.message || "Sync save failed" }, { status: 503 });
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { getSyncSnapshot, saveSyncSnapshot } from "@/lib/sync-store";
import type { SyncApiResponse, SyncErrorResponse, SyncPayload } from "@/lib/lifeos-types";

interface SyncRouteContext {
  params: Promise<{
    code?: string;
  }>;
}

interface SyncRequestBody {
  state?: SyncPayload;
}

function normalizeCode(code: string | undefined): string {
  return String(code || "").trim().toUpperCase();
}

export async function GET(_request: NextRequest, context: SyncRouteContext) {
  try {
    const params = await context.params;
    const code = normalizeCode(params.code);
    const record = await getSyncSnapshot(code);

    if (!record) {
      return NextResponse.json<SyncErrorResponse>({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json<SyncApiResponse>(record);
  } catch (error) {
    return NextResponse.json<SyncErrorResponse>({ error: getErrorMessage(error, "Sync fetch failed") }, { status: 503 });
  }
}

export async function PUT(request: NextRequest, context: SyncRouteContext) {
  try {
    const params = await context.params;
    const code = normalizeCode(params.code);
    const body = (await request.json()) as SyncRequestBody;

    if (!code || !body?.state) {
      return NextResponse.json<SyncErrorResponse>({ error: "Invalid payload" }, { status: 400 });
    }

    const record = await saveSyncSnapshot(code, body.state);
    return NextResponse.json<SyncApiResponse>(record);
  } catch (error) {
    return NextResponse.json<SyncErrorResponse>({ error: getErrorMessage(error, "Sync save failed") }, { status: 503 });
  }
}

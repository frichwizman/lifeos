import type { LifeOSState, SyncApiResponse, SyncErrorResponse, SyncPayload } from "@/lib/lifeos-types";

function normalizeSyncResponse(payload: SyncApiResponse | null | undefined): LifeOSState | null {
  const state = payload?.state;
  if (!state) return null;

  const savedAt = payload?.savedAt || new Date().toISOString();
  const logicalUpdatedAt = state.sync?.updatedAt || savedAt;
  return {
    ...state,
    sync: {
      ...(state.sync ?? {}),
      updatedAt: logicalUpdatedAt,
      lastSyncedAt: savedAt,
      status: "synced",
      error: ""
    }
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as SyncErrorResponse;
  return data.error || "Sync request failed.";
}

export async function fetchSyncState(syncCode: string): Promise<LifeOSState | null> {
  const response = await fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Failed to fetch sync state.");
  }

  const data = (await response.json()) as SyncApiResponse;
  return normalizeSyncResponse(data);
}

export async function pushSyncState(syncCode: string, state: SyncPayload): Promise<LifeOSState> {
  const response = await fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ state })
  });

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Failed to push sync state.");
  }

  const data = (await response.json()) as SyncApiResponse;
  const normalized = normalizeSyncResponse(data);
  if (!normalized) {
    throw new Error("Failed to normalize sync state.");
  }
  return normalized;
}

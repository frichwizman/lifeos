function normalizeSyncResponse(payload) {
  const state = payload?.state;
  if (!state) return null;

  const savedAt = payload?.savedAt || state.sync?.updatedAt || new Date().toISOString();
  return {
    ...state,
    sync: {
      ...(state.sync ?? {}),
      updatedAt: savedAt,
      lastSyncedAt: savedAt,
      status: "synced",
      error: ""
    }
  };
}

export async function fetchSyncState(syncCode) {
  const response = await fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch sync state.");
  }

  const data = await response.json();
  return normalizeSyncResponse(data);
}

export async function pushSyncState(syncCode, state) {
  const response = await fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ state })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to push sync state.");
  }

  const data = await response.json();
  return normalizeSyncResponse(data);
}

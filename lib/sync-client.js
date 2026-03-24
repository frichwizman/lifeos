export async function fetchSyncState(syncCode) {
  const response = await fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch sync state.");
  }

  const data = await response.json();
  return data.state;
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
    throw new Error("Failed to push sync state.");
  }

  return response.json();
}

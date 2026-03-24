const globalStore = globalThis.__lifeosSyncStore ?? new Map();

if (!globalThis.__lifeosSyncStore) {
  globalThis.__lifeosSyncStore = globalStore;
}

export function getSyncSnapshot(syncCode) {
  return globalStore.get(syncCode) ?? null;
}

export function saveSyncSnapshot(syncCode, state) {
  const record = {
    state,
    savedAt: new Date().toISOString()
  };
  globalStore.set(syncCode, record);
  return record;
}

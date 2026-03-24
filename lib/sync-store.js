import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Persistent sync is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function getSyncSnapshot(syncCode) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sync_sessions")
    .select("sync_code, user_id, state, updated_at")
    .eq("sync_code", syncCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    state: data.state,
    savedAt: data.updated_at
  };
}

export async function saveSyncSnapshot(syncCode, state) {
  const supabase = getSupabaseAdmin();
  const payload = {
    sync_code: syncCode,
    user_id: state.sync?.userId ?? null,
    state,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("sync_sessions")
    .upsert(payload, { onConflict: "sync_code" })
    .select("sync_code, user_id, state, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    state: data.state,
    savedAt: data.updated_at
  };
}

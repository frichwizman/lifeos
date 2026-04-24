import { MONEY_TASK_IDS } from "@/lib/lifeos-data";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { LifeLogRow, LifeOSLogs } from "@/lib/lifeos-types";

function getSupabaseAdmin() {
  return getSupabaseAdminClient("Life logs sync is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

function getRecordKey(record: Pick<LifeLogRow, "date_key" | "task_id">): string {
  return `${record.date_key}:${record.task_id}`;
}

function rowsToLogs(rows: LifeLogRow[]): LifeOSLogs {
  const logs: LifeOSLogs = {};

  for (const row of rows) {
    logs[row.date_key] = {
      ...(logs[row.date_key] ?? {}),
      [row.task_id]: {
        value: row.value,
        xp: Number(row.xp ?? 0),
        ts: Number(row.ts ?? 0)
      }
    };
  }

  return logs;
}

function flattenLogs(userId: string, logs: LifeOSLogs, taskIds: readonly string[]): LifeLogRow[] {
  const taskIdSet = new Set(taskIds);
  const rows: LifeLogRow[] = [];

  for (const [dateKey, day] of Object.entries(logs)) {
    for (const [taskId, record] of Object.entries(day)) {
      if (!taskIdSet.has(taskId)) continue;
      rows.push({
        user_id: userId,
        date_key: dateKey,
        task_id: taskId,
        value: record.value,
        xp: Number(record.xp ?? 0),
        ts: Number(record.ts ?? 0)
      });
    }
  }

  return rows;
}

export async function getMoneyLifeLogs(userId: string): Promise<LifeOSLogs> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("life_logs")
    .select("user_id,date_key,task_id,value,xp,ts,updated_at")
    .eq("user_id", userId)
    .in("task_id", MONEY_TASK_IDS)
    .returns<LifeLogRow[]>();

  if (error) {
    throw error;
  }

  return rowsToLogs(data ?? []);
}

export async function upsertMoneyLifeLogs(userId: string, logs: LifeOSLogs): Promise<LifeOSLogs> {
  const supabase = getSupabaseAdmin();
  const incomingRows = flattenLogs(userId, logs, MONEY_TASK_IDS);
  if (!incomingRows.length) return getMoneyLifeLogs(userId);

  const dateKeys = [...new Set(incomingRows.map((row) => row.date_key))];
  const { data: existingRows, error: existingError } = await supabase
    .from("life_logs")
    .select("user_id,date_key,task_id,value,xp,ts,updated_at")
    .eq("user_id", userId)
    .in("task_id", MONEY_TASK_IDS)
    .in("date_key", dateKeys)
    .returns<LifeLogRow[]>();

  if (existingError) {
    throw existingError;
  }

  const existingByKey = new Map((existingRows ?? []).map((row) => [getRecordKey(row), row]));
  const safeRows = incomingRows.filter((row) => {
    const existing = existingByKey.get(getRecordKey(row));
    return !existing || Number(row.ts ?? 0) >= Number(existing.ts ?? 0);
  });

  if (safeRows.length) {
    const { error } = await supabase.from("life_logs").upsert(safeRows, {
      onConflict: "user_id,date_key,task_id"
    });

    if (error) {
      throw error;
    }
  }

  return getMoneyLifeLogs(userId);
}

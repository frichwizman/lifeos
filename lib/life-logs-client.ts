import type { LifeLogsApiResponse, LifeOSLogs } from "@/lib/lifeos-types";

async function readLifeLogsError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as LifeLogsApiResponse;
  return data.error || "Life logs request failed.";
}

export async function fetchMoneyLifeLogs(): Promise<LifeOSLogs> {
  const response = await fetch("/api/life-logs", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readLifeLogsError(response));
  }

  const data = (await response.json()) as LifeLogsApiResponse;
  return data.logs ?? {};
}

export async function pushMoneyLifeLogs(logs: LifeOSLogs): Promise<LifeOSLogs> {
  const response = await fetch("/api/life-logs", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ logs })
  });

  if (!response.ok) {
    throw new Error(await readLifeLogsError(response));
  }

  const data = (await response.json()) as LifeLogsApiResponse;
  return data.logs ?? {};
}

import { NextResponse, type NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readAuthUser, writeAuthCookies } from "@/lib/auth-store";
import { getMoneyLifeLogs, upsertMoneyLifeLogs } from "@/lib/life-logs-store";
import type { AuthUser, LifeLogsApiResponse, LifeOSLogs } from "@/lib/lifeos-types";

type AuthedLifeLogsContext =
  | {
      auth: {
        user: AuthUser;
        session: Awaited<ReturnType<typeof readAuthUser>>["session"];
      };
      response: null;
    }
  | {
      auth: Awaited<ReturnType<typeof readAuthUser>>;
      response: ReturnType<typeof NextResponse.json<LifeLogsApiResponse>>;
    };

async function getAuthedUser(request: NextRequest): Promise<AuthedLifeLogsContext> {
  const auth = await readAuthUser(request);
  const user = auth.user;

  if (!user) {
    return {
      auth,
      response: NextResponse.json<LifeLogsApiResponse>({ error: "Not signed in." }, { status: 401 })
    };
  }

  return {
    auth: {
      ...auth,
      user
    },
    response: null
  };
}

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await getAuthedUser(request);
    if (response) return response;

    const logs = await getMoneyLifeLogs(auth.user.id);
    const nextResponse = NextResponse.json<LifeLogsApiResponse>({ logs, savedAt: new Date().toISOString() });
    if (auth.session) writeAuthCookies(nextResponse, auth.session);
    return nextResponse;
  } catch (error) {
    return NextResponse.json<LifeLogsApiResponse>(
      { error: getErrorMessage(error, "Unable to fetch life logs.") },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { auth, response } = await getAuthedUser(request);
    if (response) return response;

    const body = (await request.json()) as { logs?: LifeOSLogs };
    const logs = await upsertMoneyLifeLogs(auth.user.id, body.logs ?? {});
    const nextResponse = NextResponse.json<LifeLogsApiResponse>({ logs, savedAt: new Date().toISOString() });
    if (auth.session) writeAuthCookies(nextResponse, auth.session);
    return nextResponse;
  } catch (error) {
    return NextResponse.json<LifeLogsApiResponse>(
      { error: getErrorMessage(error, "Unable to save life logs.") },
      { status: 503 }
    );
  }
}

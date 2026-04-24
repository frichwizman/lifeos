import { NextResponse, type NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readAuthUser, writeAuthCookies } from "@/lib/auth-store";
import type { AuthSessionResponse } from "@/lib/lifeos-types";

export async function GET(request: NextRequest) {
  try {
    const auth = await readAuthUser(request);
    const response = NextResponse.json<AuthSessionResponse>({ user: auth.user });
    if (auth.session) writeAuthCookies(response, auth.session);
    return response;
  } catch (error) {
    return NextResponse.json<AuthSessionResponse>(
      { user: null, error: getErrorMessage(error, "Unable to read auth session.") },
      { status: 503 }
    );
  }
}

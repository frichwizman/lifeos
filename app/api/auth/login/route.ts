import { NextResponse, type NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { createGoogleAuthUrl, sendEmailLoginLink } from "@/lib/auth-store";
import type { AuthActionResponse } from "@/lib/lifeos-types";

export async function GET(request: NextRequest) {
  try {
    const url = await createGoogleAuthUrl(request.nextUrl.origin);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = getErrorMessage(error, "Login failed.");
    return NextResponse.redirect(new URL(`/settings?auth_error=${encodeURIComponent(message)}`, request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json<AuthActionResponse>({ error: "Email is required." }, { status: 400 });
    }

    await sendEmailLoginLink(email, request.nextUrl.origin);
    return NextResponse.json<AuthActionResponse>({ ok: true });
  } catch (error) {
    return NextResponse.json<AuthActionResponse>(
      { error: getErrorMessage(error, "Unable to send login link.") },
      { status: 503 }
    );
  }
}

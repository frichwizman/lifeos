import { NextResponse, type NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { exchangeAuthCode, verifyEmailOtpLink, writeAuthCookies } from "@/lib/auth-store";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const tokenHash = request.nextUrl.searchParams.get("token_hash") ?? "";
  const type = request.nextUrl.searchParams.get("type") ?? "";
  const redirectUrl = new URL("/settings", request.url);

  if (!code && !tokenHash) {
    redirectUrl.searchParams.set("auth_error", "Missing login code.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const session = tokenHash ? await verifyEmailOtpLink(tokenHash, type || "email") : await exchangeAuthCode(code);
    redirectUrl.searchParams.set("auth", "connected");
    const response = NextResponse.redirect(redirectUrl);
    writeAuthCookies(response, session);
    return response;
  } catch (error) {
    redirectUrl.searchParams.set("auth_error", getErrorMessage(error, "Login failed."));
    return NextResponse.redirect(redirectUrl);
  }
}

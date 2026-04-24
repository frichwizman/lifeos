import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/lib/lifeos-types";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const ACCESS_TOKEN_COOKIE = "lifeos-auth-access-token";
const REFRESH_TOKEN_COOKIE = "lifeos-auth-refresh-token";
const PRODUCTION_ORIGIN = "https://lifeosx.vercel.app";

function getSupabaseAdmin() {
  return getSupabaseAdminClient("Auth is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {})
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null
  };
}

function getAuthRedirectOrigin(origin: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_LIFEOS_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) return PRODUCTION_ORIGIN;
  return origin.replace(/\/$/, "");
}

export async function createGoogleAuthUrl(origin: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const redirectOrigin = getAuthRedirectOrigin(origin);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectOrigin}/api/auth/callback`,
      skipBrowserRedirect: true
    }
  });

  if (error || !data.url) {
    throw new Error(error?.message || "Unable to create Google login URL.");
  }

  return data.url;
}

export async function sendEmailLoginLink(email: string, origin: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const redirectOrigin = getAuthRedirectOrigin(origin);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${redirectOrigin}/api/auth/callback`
    }
  });

  if (error) {
    throw new Error(error.message || "Unable to send login link.");
  }
}

export async function exchangeAuthCode(code: string): Promise<Session> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    throw new Error(error?.message || "Unable to exchange login code.");
  }

  return data.session;
}

export async function verifyEmailOtpLink(tokenHash: string, type: string): Promise<Session> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType
  });

  if (error || !data.session) {
    throw new Error(error?.message || "Unable to verify login link.");
  }

  return data.session;
}

export function writeAuthCookies(response: NextResponse, session: Session): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, getCookieOptions(session.expires_in));
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, getCookieOptions(60 * 60 * 24 * 30));
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", getCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", getCookieOptions(0));
}

export async function readAuthUser(request: NextRequest): Promise<{ user: AuthUser | null; session: Session | null }> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? "";
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? "";
  const supabase = getSupabaseAdmin();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      return {
        user: toAuthUser(data.user),
        session: null
      };
    }
  }

  if (!refreshToken) {
    return {
      user: null,
      session: null
    };
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session?.user) {
    return {
      user: null,
      session: null
    };
  }

  return {
    user: toAuthUser(data.session.user),
    session: data.session
  };
}

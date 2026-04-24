import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-store";
import type { AuthActionResponse } from "@/lib/lifeos-types";

export async function POST() {
  const response = NextResponse.json<AuthActionResponse>({ ok: true });
  clearAuthCookies(response);
  return response;
}

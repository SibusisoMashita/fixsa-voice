import { NextRequest, NextResponse } from "next/server";

const DEMO_ROLE_COOKIE = "fixsa_demo_role";

function safeOpsDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/ops") || value.startsWith("//")) return "/ops";
  return value;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const destination = safeOpsDestination(formData.get("next"));
  const response = NextResponse.redirect(new URL(destination, request.url), 303);

  response.cookies.set(DEMO_ROLE_COOKIE, "operator", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

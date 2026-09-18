import { NextRequest, NextResponse } from "next/server";

const DEMO_ROLE_COOKIE = "fixsa_demo_role";

export function proxy(request: NextRequest) {
  const hasDemoOperatorRole = request.cookies.get(DEMO_ROLE_COOKIE)?.value === "operator";

  if (!hasDemoOperatorRole) {
    const accessUrl = new URL("/operator-access", request.url);
    accessUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(accessUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ops/:path*"],
};

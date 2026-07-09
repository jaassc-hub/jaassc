import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "junta_session";

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-secret-cambiar";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};

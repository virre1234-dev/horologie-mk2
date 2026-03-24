import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("horologie-auth")?.value;
  const isLogin = req.nextUrl.pathname === "/login";
  const isApi = req.nextUrl.pathname.startsWith("/api");

  if (isApi) return NextResponse.next();
  if (!auth && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (auth && isLogin) return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

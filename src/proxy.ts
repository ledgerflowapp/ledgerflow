import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  // Include search params in the next URL if they exist
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const cookiePrefix = auth.options.advanced?.cookiePrefix;
  const candidateKeys = [
    ...(cookiePrefix ? [`${cookiePrefix}.session_token`, `__Secure-${cookiePrefix}.session_token`] : []),
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ];

  const sessionCookie =
    getSessionCookie(request, cookiePrefix ? { cookiePrefix } : undefined) ||
    candidateKeys.map((key) => request.cookies.get(key)?.value).find(Boolean);

  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const PROTECTED_ROUTES = [
    "/dashboard",
    "/transactions",
    "/friends",
    "/groups"
  ];
  const isProtectedPage = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!sessionCookie) {
    if (isProtectedPage) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch {
    session = null;
  }

  const isValidSession = Boolean(session?.session && session?.user);

  if (isProtectedPage && !isValidSession) {
    return redirectToLogin(request);
  }

  if (isAuthPage && isValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/transactions/:path*", 
    "/friends/:path*", 
    "/groups/:path*", 
    "/login"
  ],
};

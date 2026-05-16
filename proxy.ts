import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await auth();
  const isAuthenticated = !!session;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/register",
    "/auth/error",
    "/api/auth",
  ];

  // Public API routes with specific methods
  const publicApiRoutes = [
    { path: "/api/v1/events", method: "GET", exact: false }, // GET /api/v1/events and /api/v1/events/[id]
    { path: "/api/v1/transactions/webhook", method: "POST", exact: true },
  ];

  // Check if it's a public API route with specific method
  const isPublicApiRoute = publicApiRoutes.some((route) => {
    const isPathMatch = route.exact
      ? pathname === route.path
      : pathname.startsWith(route.path);
    return isPathMatch && req.method === route.method;
  });

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/v1");

  // Allow access if it's public or authenticated
  if (isPublicRoute || isPublicApiRoute || !isProtectedRoute || isAuthenticated) {
    return NextResponse.next();
  }

  // Redirect to sign-in for unauthenticated access to protected routes
  const signInUrl = new URL("/auth/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

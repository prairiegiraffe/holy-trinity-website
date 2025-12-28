import { defineMiddleware } from "astro:middleware";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Public routes - no auth needed
  const publicRoutes = [
    "/admin/login",
    "/admin/accept-invite",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/accept-invite",
  ];

  // Check if this is a public route
  if (publicRoutes.some((route) => pathname === route)) {
    return next();
  }

  // Check if this is an admin route or protected API route
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApiRoute =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/images/") &&
    !pathname.startsWith("/api/auth/");

  // Public API routes (GET only for blog/events)
  if (
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/events")
  ) {
    if (context.request.method === "GET") {
      return next();
    }
  }

  // If not an admin or protected API route, continue
  if (!isAdminRoute && !isProtectedApiRoute) {
    return next();
  }

  // Get token from cookie or Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const cookieToken = context.cookies.get("auth_token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) {
    // Redirect to login for page requests
    if (isAdminRoute) {
      return context.redirect("/admin/login");
    }
    // Return 401 for API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const jwtSecret = context.locals.runtime.env.JWT_SECRET;
    const payload = await verifyAccessToken(token, jwtSecret);

    // Add user to locals for use in routes
    context.locals.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    return next();
  } catch (error) {
    // Token invalid or expired
    console.error("Auth error:", error);

    // Clear invalid cookie
    context.cookies.delete("auth_token", { path: "/" });

    if (isAdminRoute) {
      return context.redirect("/admin/login");
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

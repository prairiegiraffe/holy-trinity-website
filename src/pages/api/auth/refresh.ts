import type { APIRoute } from "astro";
import type { ApiResponse, User, Session } from "@/types/cms";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    const refreshToken = cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NO_TOKEN", message: "No refresh token provided" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;
    const jwtSecret = locals.runtime.env.JWT_SECRET;

    // Verify the refresh token
    let tokenPayload;
    try {
      tokenPayload = await verifyRefreshToken(refreshToken, jwtSecret);
    } catch {
      cookies.delete("refresh_token", { path: "/" });
      cookies.delete("auth_token", { path: "/" });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid refresh token" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if session exists in database
    const session = await db
      .prepare(
        "SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime('now')"
      )
      .bind(refreshToken)
      .first<Session>();

    if (!session) {
      cookies.delete("refresh_token", { path: "/" });
      cookies.delete("auth_token", { path: "/" });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "SESSION_EXPIRED", message: "Session expired" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user data
    const user = await db
      .prepare("SELECT * FROM users WHERE id = ? AND is_active = 1")
      .bind(tokenPayload.sub)
      .first<User>();

    if (!user) {
      cookies.delete("refresh_token", { path: "/" });
      cookies.delete("auth_token", { path: "/" });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new tokens (token rotation)
    const newAccessToken = await createAccessToken(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      jwtSecret
    );

    const newRefreshToken = await createRefreshToken(user.id, jwtSecret);
    const expiresAt = getRefreshTokenExpiry();

    // Update session with new refresh token
    await db
      .prepare(
        "UPDATE sessions SET refresh_token = ?, expires_at = ? WHERE id = ?"
      )
      .bind(newRefreshToken, expiresAt, session.id)
      .run();

    // Set new cookies
    cookies.set("auth_token", newAccessToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    });

    cookies.set("refresh_token", newRefreshToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Refresh error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

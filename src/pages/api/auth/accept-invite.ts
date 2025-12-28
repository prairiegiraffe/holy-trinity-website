import type { APIRoute } from "astro";
import type { ApiResponse, User } from "@/types/cms";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "MISSING_FIELDS", message: "Token and password are required" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "WEAK_PASSWORD", message: passwordValidation.message },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;
    const jwtSecret = locals.runtime.env.JWT_SECRET;

    // Find user by invite token
    const user = await db
      .prepare(
        "SELECT * FROM users WHERE invite_token = ? AND invite_expires_at > datetime('now')"
      )
      .bind(token)
      .first<User>();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired invite token" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash password and activate user
    const passwordHash = await hashPassword(password);

    await db
      .prepare(
        `UPDATE users
         SET password_hash = ?, is_active = 1, invite_token = NULL, invite_expires_at = NULL, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(passwordHash, user.id)
      .run();

    // Create tokens and log user in
    const accessToken = await createAccessToken(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      jwtSecret
    );

    const refreshToken = await createRefreshToken(user.id, jwtSecret);
    const expiresAt = getRefreshTokenExpiry();

    // Store refresh token in database
    await db
      .prepare(
        "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)"
      )
      .bind(user.id, refreshToken, expiresAt)
      .run();

    // Set cookies
    cookies.set("auth_token", accessToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 15,
    });

    cookies.set("refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Account activated successfully",
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
    console.error("Accept invite error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Validate invite token (for the accept-invite page)
export const GET: APIRoute = async ({ url, locals }) => {
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "MISSING_TOKEN", message: "Token is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    const user = await db
      .prepare(
        "SELECT id, email, name, role FROM users WHERE invite_token = ? AND invite_expires_at > datetime('now')"
      )
      .bind(token)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired invite token" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          email: user.email,
          name: user.name,
        },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validate invite error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

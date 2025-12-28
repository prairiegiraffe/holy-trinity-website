import type { APIRoute } from "astro";
import type { ApiResponse, User } from "@/types/cms";
import { verifyPassword } from "@/lib/auth/password";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "MISSING_FIELDS", message: "Email and password are required" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;
    const jwtSecret = locals.runtime.env.JWT_SECRET;

    // Find user by email
    const user = await db
      .prepare("SELECT * FROM users WHERE email = ? AND is_active = 1")
      .bind(email.toLowerCase())
      .first<User>();

    if (!user || !user.password_hash) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        } satisfies ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create tokens
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
      maxAge: 60 * 15, // 15 minutes
    });

    cookies.set("refresh_token", refreshToken, {
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
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
        },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred during login" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

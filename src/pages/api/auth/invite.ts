import type { APIRoute } from "astro";
import type { ApiResponse, User } from "@/types/cms";
import { generateInviteToken, getInviteExpiry } from "@/lib/auth/jwt";

export const POST: APIRoute = async ({ request, locals }) => {
  // Only admins can invite users
  if (!locals.user || locals.user.role !== "admin") {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" },
      } satisfies ApiResponse),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { email, name, role = "editor" } = body;

    if (!email || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "MISSING_FIELDS", message: "Email and name are required" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_EMAIL", message: "Invalid email format" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate role
    if (role !== "admin" && role !== "editor") {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_ROLE", message: "Role must be admin or editor" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;

    // Check if user already exists
    const existingUser = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first<User>();

    if (existingUser) {
      if (existingUser.is_active) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: "USER_EXISTS", message: "User with this email already exists" },
          } satisfies ApiResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // User exists but hasn't accepted invite - resend
      const inviteToken = generateInviteToken();
      const inviteExpiry = getInviteExpiry();

      await db
        .prepare(
          "UPDATE users SET name = ?, role = ?, invite_token = ?, invite_expires_at = ?, updated_at = datetime('now') WHERE id = ?"
        )
        .bind(name, role, inviteToken, inviteExpiry, existingUser.id)
        .run();

      const siteUrl = locals.runtime.env.SITE_URL || "http://localhost:4321";
      const inviteUrl = `${siteUrl}/admin/accept-invite?token=${inviteToken}`;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Invite resent",
            inviteUrl,
            // In production, you would send an email instead of returning the URL
          },
        } satisfies ApiResponse),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new user with invite token
    const inviteToken = generateInviteToken();
    const inviteExpiry = getInviteExpiry();

    const result = await db
      .prepare(
        `INSERT INTO users (email, name, role, invite_token, invite_expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, 0)`
      )
      .bind(email.toLowerCase(), name, role, inviteToken, inviteExpiry)
      .run();

    const siteUrl = locals.runtime.env.SITE_URL || "http://localhost:4321";
    const inviteUrl = `${siteUrl}/admin/accept-invite?token=${inviteToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId: result.meta.last_row_id,
          inviteUrl,
          message: "User invited successfully",
          // In production, you would send an email instead of returning the URL
        },
      } satisfies ApiResponse),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Invite error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Get list of all users (admin only)
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== "admin") {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" },
      } satisfies ApiResponse),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    const { results } = await db
      .prepare(
        "SELECT id, email, name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC"
      )
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get users error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "An error occurred" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

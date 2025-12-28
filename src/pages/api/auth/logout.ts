import type { APIRoute } from "astro";
import type { ApiResponse } from "@/types/cms";

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    const refreshToken = cookies.get("refresh_token")?.value;

    if (refreshToken) {
      const db = locals.runtime.env.DB;
      // Delete the session from database
      await db
        .prepare("DELETE FROM sessions WHERE refresh_token = ?")
        .bind(refreshToken)
        .run();
    }

    // Clear cookies
    cookies.delete("auth_token", { path: "/" });
    cookies.delete("refresh_token", { path: "/" });

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Logged out successfully" },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear cookies even if DB operation fails
    cookies.delete("auth_token", { path: "/" });
    cookies.delete("refresh_token", { path: "/" });

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Logged out" },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};

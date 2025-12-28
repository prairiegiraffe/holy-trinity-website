import type { APIRoute } from "astro";
import type { ApiResponse } from "@/types/cms";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      } satisfies ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        user: locals.user,
      },
    } satisfies ApiResponse),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

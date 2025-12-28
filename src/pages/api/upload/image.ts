import type { APIRoute } from "astro";
import type { ApiResponse } from "@/types/cms";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: APIRoute = async ({ request, locals }) => {
  // Check auth
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NO_FILE", message: "No file provided" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_TYPE",
            message: "File must be JPEG, PNG, GIF, or WebP",
          },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "FILE_TOO_LARGE", message: "File must be under 5MB" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;

    // Upload to R2
    const r2 = locals.runtime.env.IMAGES;
    const arrayBuffer = await file.arrayBuffer();

    await r2.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return the public URL
    // Note: You'll need to set up a custom domain or use R2 public access
    // For now, we'll return a path that can be served via a route
    const url = `/api/images/${filename}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: { url, filename },
      } satisfies ApiResponse<{ url: string; filename: string }>),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UPLOAD_FAILED", message: "Failed to upload image" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

import type { APIRoute } from "astro";
import type { ApiResponse, BlogPost } from "@/types/cms";
import Slugger from "github-slugger";

const slugger = new Slugger();

// GET single blog post
export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "MISSING_ID", message: "Post ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    // Try to find by ID or slug
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? `SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id WHERE bp.id = ?`
      : `SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id WHERE bp.slug = ?`;

    const post = await db.prepare(query).bind(id).first<BlogPost>();

    if (!post) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Blog post not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // If user is not authenticated, only show published posts
    if (!locals.user && post.status !== "published") {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Blog post not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: post,
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get blog post error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch blog post" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// PUT update blog post
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "MISSING_ID", message: "Post ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { title, content, excerpt, featured_image, status, meta_title, meta_description } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Title and content are required" },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;

    // Check if post exists
    const existing = await db
      .prepare("SELECT * FROM blog_posts WHERE id = ?")
      .bind(id)
      .first<BlogPost>();

    if (!existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Blog post not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (title !== existing.title) {
      slugger.reset();
      slug = slugger.slug(title);

      // Check if new slug exists (excluding current post)
      const slugExists = await db
        .prepare("SELECT id FROM blog_posts WHERE slug = ? AND id != ?")
        .bind(slug, id)
        .first();

      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Set published_at if publishing for the first time
    let publishedAt = existing.published_at;
    if (status === "published" && !existing.published_at) {
      publishedAt = new Date().toISOString();
    }

    await db
      .prepare(
        `UPDATE blog_posts
         SET slug = ?, title = ?, content = ?, excerpt = ?, featured_image = ?,
             status = ?, published_at = ?, meta_title = ?, meta_description = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        slug,
        title,
        content,
        excerpt || null,
        featured_image || null,
        status || "draft",
        publishedAt,
        meta_title || null,
        meta_description || null,
        id
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: parseInt(id), slug },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Update blog post error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update blog post" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE blog post
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "MISSING_ID", message: "Post ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    const result = await db
      .prepare("DELETE FROM blog_posts WHERE id = ?")
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Blog post not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Blog post deleted" },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete blog post error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to delete blog post" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

import type { APIRoute } from "astro";
import type { ApiResponse, BlogPost } from "@/types/cms";
import Slugger from "github-slugger";

const slugger = new Slugger();

// GET all blog posts (public for published, all for authenticated)
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = locals.runtime.env.DB;
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = `
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
    `;

    // If user is authenticated, show all posts; otherwise only published
    if (locals.user) {
      if (status) {
        query += ` WHERE bp.status = ?`;
      }
    } else {
      query += ` WHERE bp.status = 'published'`;
    }

    query += ` ORDER BY bp.created_at DESC LIMIT ? OFFSET ?`;

    const stmt = status && locals.user
      ? db.prepare(query).bind(status, limit, offset)
      : db.prepare(query).bind(limit, offset);

    const { results } = await stmt.all<BlogPost>();

    // Get total count
    let countQuery = "SELECT COUNT(*) as count FROM blog_posts";
    if (!locals.user) {
      countQuery += " WHERE status = 'published'";
    } else if (status) {
      countQuery += ` WHERE status = '${status}'`;
    }
    const countResult = await db.prepare(countQuery).first<{ count: number }>();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          posts: results,
          total: countResult?.count || 0,
          limit,
          offset,
        },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get blog posts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch blog posts" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST create new blog post (authenticated only)
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Generate unique slug
    slugger.reset();
    let slug = slugger.slug(title);

    // Check if slug exists and make unique if needed
    const existing = await db
      .prepare("SELECT id FROM blog_posts WHERE slug = ?")
      .bind(slug)
      .first();

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const publishedAt = status === "published" ? new Date().toISOString() : null;

    const result = await db
      .prepare(
        `INSERT INTO blog_posts (slug, title, content, excerpt, featured_image, author_id, status, published_at, meta_title, meta_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        slug,
        title,
        content,
        excerpt || null,
        featured_image || null,
        locals.user.id,
        status || "draft",
        publishedAt,
        meta_title || null,
        meta_description || null
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: result.meta.last_row_id, slug },
      } satisfies ApiResponse),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create blog post error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create blog post" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

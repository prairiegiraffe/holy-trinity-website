import type { APIRoute } from "astro";
import type { ApiResponse, Event } from "@/types/cms";
import Slugger from "github-slugger";

const slugger = new Slugger();

// GET all events
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = locals.runtime.env.DB;
    const status = url.searchParams.get("status");
    const upcoming = url.searchParams.get("upcoming");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM events";
    const conditions: string[] = [];
    const bindings: (string | number)[] = [];

    // If user is not authenticated, only show published
    if (!locals.user) {
      conditions.push("status = 'published'");
    } else if (status) {
      conditions.push("status = ?");
      bindings.push(status);
    }

    // Filter for upcoming events
    if (upcoming === "true") {
      conditions.push("event_date >= date('now')");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY event_date ASC LIMIT ? OFFSET ?";
    bindings.push(limit, offset);

    const { results } = await db
      .prepare(query)
      .bind(...bindings)
      .all<Event>();

    // Get total count
    let countQuery = "SELECT COUNT(*) as count FROM events";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.slice(0, -2).join(" AND "); // Remove limit/offset bindings
    }

    const countResult = await db.prepare(countQuery).first<{ count: number }>();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          events: results,
          total: countResult?.count || 0,
          limit,
          offset,
        },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get events error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch events" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST create new event
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
    const {
      title,
      description,
      event_date,
      event_time,
      end_date,
      end_time,
      location,
      image,
      status,
      recurring,
      recurrence_rule,
      rsvp_link,
      more_info_link,
      meta_title,
      meta_description,
    } = body;

    if (!title || !description || !event_date) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Title, description, and event date are required",
          },
        } satisfies ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = locals.runtime.env.DB;

    // Generate unique slug
    slugger.reset();
    let slug = slugger.slug(title);

    const existing = await db
      .prepare("SELECT id FROM events WHERE slug = ?")
      .bind(slug)
      .first();

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await db
      .prepare(
        `INSERT INTO events (
          slug, title, description, event_date, event_time, end_date, end_time,
          location, image, status, recurring, recurrence_rule, rsvp_link,
          more_info_link, meta_title, meta_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        slug,
        title,
        description,
        event_date,
        event_time || null,
        end_date || null,
        end_time || null,
        location || null,
        image || null,
        status || "draft",
        recurring || "none",
        recurrence_rule || null,
        rsvp_link || null,
        more_info_link || null,
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
    console.error("Create event error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create event" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

import type { APIRoute } from "astro";
import type { ApiResponse, Event } from "@/types/cms";
import Slugger from "github-slugger";

const slugger = new Slugger();

// GET single event
export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "MISSING_ID", message: "Event ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    // Try to find by ID or slug
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? "SELECT * FROM events WHERE id = ?"
      : "SELECT * FROM events WHERE slug = ?";

    const event = await db.prepare(query).bind(id).first<Event>();

    if (!event) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Event not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // If user is not authenticated, only show published events
    if (!locals.user && event.status !== "published") {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Event not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: event,
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get event error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch event" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// PUT update event
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
        error: { code: "MISSING_ID", message: "Event ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
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

    // Check if event exists
    const existing = await db
      .prepare("SELECT * FROM events WHERE id = ?")
      .bind(id)
      .first<Event>();

    if (!existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Event not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (title !== existing.title) {
      slugger.reset();
      slug = slugger.slug(title);

      const slugExists = await db
        .prepare("SELECT id FROM events WHERE slug = ? AND id != ?")
        .bind(slug, id)
        .first();

      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db
      .prepare(
        `UPDATE events SET
          slug = ?, title = ?, description = ?, event_date = ?, event_time = ?,
          end_date = ?, end_time = ?, location = ?, image = ?, status = ?,
          recurring = ?, recurrence_rule = ?, rsvp_link = ?, more_info_link = ?,
          meta_title = ?, meta_description = ?, updated_at = datetime('now')
        WHERE id = ?`
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
    console.error("Update event error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update event" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE event
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
        error: { code: "MISSING_ID", message: "Event ID is required" },
      } satisfies ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const db = locals.runtime.env.DB;

    const result = await db
      .prepare("DELETE FROM events WHERE id = ?")
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Event not found" },
        } satisfies ApiResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Event deleted" },
      } satisfies ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete event error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to delete event" },
      } satisfies ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

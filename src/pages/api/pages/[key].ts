import type { APIRoute } from 'astro';
import type { PageContent } from '@/types/cms';

// GET /api/pages/:key - Get a single page by key
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { key } = params;

    const page = await db
      .prepare(`
        SELECT pc.*, u.name as updated_by_name
        FROM page_content pc
        LEFT JOIN users u ON pc.updated_by = u.id
        WHERE pc.page_key = ?
      `)
      .bind(key)
      .first<PageContent & { updated_by_name: string }>();

    if (!page) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Page not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse content_json if it's a string
    if (typeof page.content_json === 'string') {
      try {
        page.content_json = JSON.parse(page.content_json);
      } catch {
        // Keep as string if parse fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch page'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/pages/:key - Update a page
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check auth
    if (!locals.user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;
    const { key } = params;
    const body = await request.json();

    // Check if page exists
    const existing = await db
      .prepare('SELECT id FROM page_content WHERE page_key = ?')
      .bind(key)
      .first();

    if (!existing) {
      // Create new page if it doesn't exist
      const { content_json, markdown_body } = body;

      const result = await db
        .prepare(`
          INSERT INTO page_content (page_key, content_json, markdown_body, updated_by)
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          key,
          content_json ? JSON.stringify(content_json) : '{}',
          markdown_body || null,
          locals.user.id
        )
        .run();

      const page = await db
        .prepare('SELECT * FROM page_content WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first<PageContent>();

      return new Response(JSON.stringify({
        success: true,
        data: page
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { content_json, markdown_body } = body;

    await db
      .prepare(`
        UPDATE page_content SET
          content_json = ?,
          markdown_body = ?,
          updated_by = ?,
          updated_at = datetime('now')
        WHERE page_key = ?
      `)
      .bind(
        content_json ? JSON.stringify(content_json) : '{}',
        markdown_body || null,
        locals.user.id,
        key
      )
      .run();

    const page = await db
      .prepare(`
        SELECT pc.*, u.name as updated_by_name
        FROM page_content pc
        LEFT JOIN users u ON pc.updated_by = u.id
        WHERE pc.page_key = ?
      `)
      .bind(key)
      .first<PageContent & { updated_by_name: string }>();

    return new Response(JSON.stringify({
      success: true,
      data: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update page'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/pages/:key - Delete a page
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Check auth - only admins can delete pages
    if (!locals.user || locals.user.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin access required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;
    const { key } = params;

    const existing = await db
      .prepare('SELECT id FROM page_content WHERE page_key = ?')
      .bind(key)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Page not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare('DELETE FROM page_content WHERE page_key = ?')
      .bind(key)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Page deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete page'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

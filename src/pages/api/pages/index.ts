import type { APIRoute } from 'astro';
import type { PageContent } from '@/types/cms';

// GET /api/pages - List all editable pages
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime.env.DB;

    const { results } = await db
      .prepare(`
        SELECT pc.*, u.name as updated_by_name
        FROM page_content pc
        LEFT JOIN users u ON pc.updated_by = u.id
        ORDER BY pc.page_key ASC
      `)
      .all<PageContent & { updated_by_name: string }>();

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch pages'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/pages - Create a new page content entry
export const POST: APIRoute = async ({ request, locals }) => {
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
    const body = await request.json();

    const { page_key, content_json, markdown_body } = body;

    if (!page_key) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Page key is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if page already exists
    const existing = await db
      .prepare('SELECT id FROM page_content WHERE page_key = ?')
      .bind(page_key)
      .first();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Page with this key already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db
      .prepare(`
        INSERT INTO page_content (page_key, content_json, markdown_body, updated_by)
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        page_key,
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
  } catch (error) {
    console.error('Error creating page:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create page'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

import type { APIRoute } from 'astro';
import type { Member } from '@/types/cms';

// GET /api/members/:id - Get a single member
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;

    const member = await db
      .prepare('SELECT * FROM members WHERE id = ?')
      .bind(id)
      .first<Member>();

    if (!member) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Member not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: member
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch member'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/members/:id - Update a member
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
    const { id } = params;
    const body = await request.json();

    // Check if member exists
    const existing = await db
      .prepare('SELECT id FROM members WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Member not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const {
      group_type,
      name,
      title,
      term,
      image,
      bio,
      sort_order
    } = body;

    // Validate required fields
    if (!group_type || !name || !title) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Group type, name, and title are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate group_type
    const validGroups = ['vestry', 'music-team', 'endowment', 'clergy'];
    if (!validGroups.includes(group_type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid group type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare(`
        UPDATE members SET
          group_type = ?,
          name = ?,
          title = ?,
          term = ?,
          image = ?,
          bio = ?,
          sort_order = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(
        group_type,
        name,
        title,
        term || null,
        image || null,
        bio || null,
        sort_order || 0,
        id
      )
      .run();

    // Fetch the updated member
    const member = await db
      .prepare('SELECT * FROM members WHERE id = ?')
      .bind(id)
      .first<Member>();

    return new Response(JSON.stringify({
      success: true,
      data: member
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update member'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/members/:id - Delete a member
export const DELETE: APIRoute = async ({ params, locals }) => {
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
    const { id } = params;

    // Check if member exists
    const existing = await db
      .prepare('SELECT id FROM members WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Member not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare('DELETE FROM members WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Member deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete member'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

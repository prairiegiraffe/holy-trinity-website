import type { APIRoute } from 'astro';
import type { Member } from '@/types/cms';

// GET /api/members - List all members (optionally filtered by group_type)
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);
    const groupType = url.searchParams.get('group');

    let query = 'SELECT * FROM members';
    const params: string[] = [];

    if (groupType) {
      query += ' WHERE group_type = ?';
      params.push(groupType);
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const stmt = params.length > 0
      ? db.prepare(query).bind(...params)
      : db.prepare(query);

    const { results } = await stmt.all<Member>();

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch members'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/members - Create a new member
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

    const result = await db
      .prepare(`
        INSERT INTO members (group_type, name, title, term, image, bio, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        group_type,
        name,
        title,
        term || null,
        image || null,
        bio || null,
        sort_order || 0
      )
      .run();

    // Fetch the created member
    const member = await db
      .prepare('SELECT * FROM members WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Member>();

    return new Response(JSON.stringify({
      success: true,
      data: member
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating member:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create member'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

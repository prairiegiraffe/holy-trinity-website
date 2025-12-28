import type { APIRoute } from 'astro';
import type { Testimonial } from '@/types/cms';

// GET /api/testimonials - List all testimonials
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    let query = 'SELECT * FROM testimonials';

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const { results } = await db.prepare(query).all<Testimonial>();

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch testimonials'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/testimonials - Create a new testimonial
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
      author,
      organization,
      rating,
      content,
      is_active,
      sort_order
    } = body;

    // Validate required fields
    if (!author || !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Author and content are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate rating if provided
    const validRatings = ['one', 'two', 'three', 'four', 'five'];
    if (rating && !validRatings.includes(rating)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid rating'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db
      .prepare(`
        INSERT INTO testimonials (author, organization, rating, content, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        author,
        organization || null,
        rating || 'five',
        content,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 0
      )
      .run();

    // Fetch the created testimonial
    const testimonial = await db
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Testimonial>();

    return new Response(JSON.stringify({
      success: true,
      data: testimonial
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create testimonial'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

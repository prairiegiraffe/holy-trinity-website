import type { APIRoute } from 'astro';
import type { Testimonial } from '@/types/cms';

// GET /api/testimonials/:id - Get a single testimonial
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;

    const testimonial = await db
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .bind(id)
      .first<Testimonial>();

    if (!testimonial) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Testimonial not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: testimonial
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch testimonial'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/testimonials/:id - Update a testimonial
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

    // Check if testimonial exists
    const existing = await db
      .prepare('SELECT id FROM testimonials WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Testimonial not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    await db
      .prepare(`
        UPDATE testimonials SET
          author = ?,
          organization = ?,
          rating = ?,
          content = ?,
          is_active = ?,
          sort_order = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(
        author,
        organization || null,
        rating || 'five',
        content,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 0,
        id
      )
      .run();

    // Fetch the updated testimonial
    const testimonial = await db
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .bind(id)
      .first<Testimonial>();

    return new Response(JSON.stringify({
      success: true,
      data: testimonial
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update testimonial'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/testimonials/:id - Delete a testimonial
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

    // Check if testimonial exists
    const existing = await db
      .prepare('SELECT id FROM testimonials WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Testimonial not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare('DELETE FROM testimonials WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Testimonial deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete testimonial'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

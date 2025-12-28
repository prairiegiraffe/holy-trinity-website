import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const { filename } = params;

  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const r2 = locals.runtime.env.IMAGES;
    const object = await r2.get(filename);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Image fetch error:", error);
    return new Response("Not found", { status: 404 });
  }
};

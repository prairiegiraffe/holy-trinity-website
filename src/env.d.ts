/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type R2Bucket = import("@cloudflare/workers-types").R2Bucket;

interface CloudflareEnv {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  SITE_URL: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: number;
      email: string;
      name: string;
      role: "admin" | "editor";
    };
  }
}

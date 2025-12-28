import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig, sharpImageService } from "astro/config";
import config from "./src/config/config.json";
import AutoImport from "astro-auto-import";

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "https://holytrinitygillette.org",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",

  // Enable SSR with Cloudflare adapter
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    },
    // Required for Cloudflare Workers compatibility
    ssr: {
      external: [
        "node:crypto",
        "node:buffer",
        "node:path",
        "node:fs",
        "crypto",
        "bcryptjs",
        "astro-font",
      ],
    },
  },

  // Image optimization service
  image: {
    service: sharpImageService(),
  },

  integrations: [
    react(),
    sitemap(),
    tailwind(),
    AutoImport({
      // import react components to use in mdx
      imports: [
        "@/components/react/FeatherIcon.tsx",
        "@/components/CounterComponent.astro",
        "@/components/core/Section.astro",
        "@/components/react/Changelog.tsx",
        "@/components/Badge.astro",
      ],
    }),
    mdx()
  ],

  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    }
  }
});

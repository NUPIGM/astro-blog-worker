// @ts-check
import { defineConfig, svgoOptimizer } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://whatlearn.cc.cd",
  trailingSlash: "always",
  output: "static",
  compressHTML: true,
  integrations: [mdx(), sitemap()],
  adapter: cloudflare({
    imageService: "compile",
  }),
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: "lightningcss",
    },
  },
});

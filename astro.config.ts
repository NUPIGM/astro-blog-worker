// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, svgoOptimizer } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://oo.fish/",
  integrations: [mdx(), sitemap()],
  adapter: cloudflare({
    imageService: "compile"
  }),
  experimental: {
    svgOptimizer: svgoOptimizer()
  },
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: "lightningcss"
    }
  }
});

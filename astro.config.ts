// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import playformCompress from "@playform/compress";
import { defineConfig } from "astro/config";
import astroIcon from "astro-icon";

// astro dev 启动时，@cloudflare/vite-plugin 会拉起 workerd runner，
// 但其依赖的 workerd（≥1.20260701.1）存在回归 bug，会在 dev server 启动时报
// "Missing field `moduleType`"（cloudflare/workers-sdk#15129，
// 截至 @cloudflare/vite-plugin 1.62.0 仍未修复）。
// 本站为 output: "static"，dev 期不需要 workerd 运行时，故仅在构建时挂载适配器。
const isBuild = process.argv.slice(2).includes("build");

// https://astro.build/config
export default defineConfig({
    adapter: isBuild ? cloudflare({}) : undefined,
    integrations: [
        mdx(),
        astroIcon({
            include: {
                mdi: ["*"],
                ri: ["*"],
                "simple-icons": ["*"]
            }
        }),
        playformCompress({
            CSS: true,
            Image: true,
            Action: {
                Passed: async () => true
            }
        })
    ],
    output: "static"
});

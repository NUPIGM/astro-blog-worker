type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

/**
 * Astro 组件模块声明。
 *
 * Starwind 生成的组件索引入口（src/components/starwind/<name>/index.ts）
 * 会 `import X from "./X.astro"`。纯 tsc 不认识 .astro 后缀，
 * 这里补一个模块声明，让 `npm run check`（astro build && tsc）保持通过。
 */
declare module "*.astro" {
  const Component: (props: Record<string, any>) => unknown;
  export default Component;
}

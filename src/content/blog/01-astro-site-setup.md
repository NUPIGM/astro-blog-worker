---
title: "从零搭建一个 Astro 个人站"
description: "用 Astro 快速搭建一个现代化的个人博客和作品展示网站。"
pubDate: "2026-09-15"
heroImage: "/blog-placeholder-1.jpg"
tags: ["Astro", "个人站点", "建站"]
---

# 从零搭建一个 Astro 个人站

如果你想把自己的技术笔记、博客文章、作品展示和个人介绍放到一个统一的站点里，Astro 是一个非常适合的选择。它的优势在于：构建速度快、内容组织清晰、页面渲染灵活，同时对静态站点和博客场景都很友好。

## 为什么选择 Astro

很多新手一开始会犹豫：用 Next.js、Vite、Hexo 还是 Astro？

Astro 的核心价值有三点：

- 适合内容型网站：博客、文档、技术站点特别自然。
- 默认静态输出：部署成本低，适合托管到 Cloudflare、Vercel、GitHub Pages。
- 组件化编程体验：你仍然可以使用组件、模板和路由组织代码。

## 安装与初始化

最常见的方式是用命令行初始化项目：

```bash
npm create astro@latest
```

初始化后，你会得到一个基础项目结构，通常包含：

- `src/pages`：页面目录
- `src/components`：组件目录
- `src/content`：文章内容目录
- `src/styles`：样式目录
- `astro.config.mjs`：Astro 配置文件

## 目录结构的意义

一个简洁的网站项目通常会这样组织：

```text
src/
  components/
  content/
  layouts/
  pages/
  styles/
```

其中：

- `pages` 负责路由
- `content` 负责文章 Markdown
- `components` 负责复用 UI
- `layouts` 负责页面骨架

## 第一个页面

在 Astro 中，页面就是一个 `.astro` 文件。比如：

```astro

---
---

<html>
  <body>
    <h1>Hello, Astro!</h1>
  </body>
</html>

```

这就是最简单的页面。之后你只需要把 Header、Footer 和文章列表组件分别拆出来，就能逐步搭成完整站点。

## 定义站点信息

常见的做法是把站点标题、描述、基础链接等放进一个常量文件，例如：

```ts
export const SITE_TITLE = "My Blog";
export const SITE_DESCRIPTION = "A personal site built with Astro";
```

这样可以让页面头部、主页、RSS 等地方复用统一的信息。

## 结语

Astro 非常适合做“内容站”，尤其是博客、个人网站、技术文章站点。在第一阶段，不需要追求复杂功能，先把内容展示清晰、页面结构稳定、站点部署顺利完成，才是最重要的。

下一步，你可以把文章内容写进 `src/content/blog`，再生成列表页和详情页。这样你的站点会从“静态页面”逐步升级成“完整博客”。

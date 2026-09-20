---
title: "博客站点的目录结构设计"
description: "介绍 Astro 博客项目中常见目录和职责分工，帮助你组织内容和组件。"
pubDate: "2026-09-15"
heroImage: "/blog-placeholder-1.jpg"
tags: ["Astro", "项目结构", "博客"]
---

# 博客站点的目录结构设计

做一个可维护的博客，不只是写文章，还需要把项目组织得清晰。很多站点在刚刚起步时，页面和组件都放在一起，后面再维护时就会越来越乱。更好的方式是提前规划目录结构。

## 一个典型 Astro 项目

下面是一份比较常见的结构：

```text
src/
  components/
    Header.astro
    Footer.astro
    BaseHead.astro
  content/
    blog/
      first-post.md
      second-post.md
  layouts/
    BaseLayout.astro
    BlogPost.astro
  pages/
    index.astro
    about.astro
    post.astro
    post/[...slug].astro
  styles/
    global.css
```

## 各模块职责

### `components/`

用于存放可复用 UI，例如：

- Header
- Footer
- BaseHead
- 卡片组件
- 文章列表组件

### `content/`

用于存放博客内容源文件，比如 Markdown。这样可以让内容和渲染逻辑分离，后期还可以统一加 frontmatter 结构校验。

### `layouts/`

页面骨架的地方，通常放：

- 全局布局
- 文章正文布局
- 一些公共容器样式

### `pages/`

这里是路由入口，Astro 会根据文件路径生成页面：

- `index.astro` -> `/`
- `about.astro` -> `/about`
- `post.astro` -> `/post`

动态路由常见写法：

```text
post/[...slug].astro
```

这样就能按文章 slug 生成详情页：

```text
/post/hello-world/
/post/astro-start/
```

## 正确的内容组织思路

对于技术博客来说，最重要的是：把内容和展示分开。文章写进 Markdown，页面负责渲染，而不是把每篇文章的 HTML 直接写死在页面里。

这样做的好处：

- 文章更容易维护
- 修改样式不会影响内容
- 可以轻松加 RSS、分类、标签导航
- 后期可扩展能力更强

## 结语

站点结构不是“炫技”，而是长期维护的基础。把项目拆成清晰的职责层次后，后续新增页面、文章、组件都会更顺畅。对个人站点尤其重要，因为你会不断迭代内容和功能。

如果你已经搭了基础架构，下一步就可以开始进入“内容建设”阶段：写文章、整理导航、补充首页卡片和详情页。

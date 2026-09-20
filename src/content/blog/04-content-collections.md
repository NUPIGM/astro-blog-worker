---
title: "Astro Content Collections 的使用方式"
description: "学习如何在 Astro 中用 Content Collections 管理博客文章和元数据。"
pubDate: "2026-09-15"
heroImage: "/blog-placeholder-1.jpg"
tags: ["Astro", "内容集合", "Markdown"]
---

# Astro Content Collections 的使用方式

Astro 的内容管理非常适合博客场景。它不需要你把文章混在页面的 JS 里，而是允许你把内容都放到 `src/content` 中统一管理。

## 什么是 Content Collections

Content collections 是 Astro 提供的一种内容组织方式。它让你可以：

- 把 Markdown 文件集中在一个目录
- 给文章定义统一的结构
- 对字段做类型校验
- 在页面中更方便地读取内容

## 一个典型配置

```ts
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };
```

这里的关键点包括：

- `loader` 指定文章目录
- `pattern` 指定文件类型
- `schema` 用于约束文章 frontmatter

## 内容文件示例

```md
---
title: "Hello Astro"
description: "This is my first article"
pubDate: "2026-09-15"
heroImage: "/blog-placeholder-1.jpg"
---

# Hello Astro

Welcome to my blog.
```

这样做的好处是：如果你忘了写 `title` 或 `pubDate`，构建时就能及时报错。

## 获取文章列表

在页面中，你可以这样读取：

```astro
---
import { getCollection } from "astro:content";

const posts = await getCollection("blog");
---

<ul>
  {posts.map((post) => (
    <li>
      <a href={`/post/${post.id}/`}>{post.data.title}</a>
    </li>
  ))}
</ul>
```

这比手工维护一个 JSON 数组更稳，也更适合扩展。

## 适合博客的原因

内容集合非常适合：

- 文章列表页
- 分类页面
- RSS 订阅
- 归档页
- 搜索索引

它让“写文章”和“写页面”真正分离，让长期维护更加顺畅。

## 结语

如果你要把博客从“静态页面”升级成“内容网站”，Content Collections 是最值得学的基础能力之一。它让站点从一堆零散帖子变成一个真正可维护的内容体系。

/**
 * 富文本白名单净化。
 *
 * 视频简介等字段来自第三方采集接口，属于完全不可信输入，
 * 直接 {@html} 会被注入 <script>、onerror=、javascript: 等载荷。
 *
 * 策略：用 DOMParser 解析成惰性文档（脚本不会执行），
 * 再按标签白名单重建 DOM：危险标签整体丢弃，其余未知标签拆壳保留文本，
 * 所有属性一律移除。输出仅含白名单标签、零属性的 HTML。
 */

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "SPAN",
  "DIV",
]);

const DROP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "FRAME",
  "FRAMESET",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "BASE",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "SVG",
  "MATH",
]);

function clean(parent: Node): void {
  for (const node of Array.from(parent.childNodes)) {
    // 文本节点保留
    if (node.nodeType === Node.TEXT_NODE) continue;

    // 注释、CDATA、处理指令等一律丢弃
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.remove();
      continue;
    }

    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (DROP_TAGS.has(tag)) {
      el.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // 未知标签：保留纯文本，丢弃标签本身
      el.replaceWith(document.createTextNode(el.textContent ?? ""));
      continue;
    }

    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name);
    }
    clean(el);
  }
}

export function sanitizeRichText(input: unknown): string {
  if (typeof input !== "string" || input.trim() === "") return "";
  // 非浏览器环境（构建期 SSR）不渲染原始 HTML
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return "";
  }

  const doc = new DOMParser().parseFromString(
    `<body>${input}</body>`,
    "text/html",
  );
  clean(doc.body);
  return doc.body.innerHTML;
}

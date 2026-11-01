---
title: "从手工写规则到 Skill 化：Surge / Loon / QuanX 响应改写实战"
description: ""
pubDate: "2026-11-2"
heroImage: ""
tags: ["代理软件", "插件", "脚本"]
---

# 从手工写规则到 Skill 化：Surge / Loon / QuanX 响应改写实战

给 iOS 上的 App 做去广告插件，长期是个「一次性劳动」：抓包、找接口、写规则、失效、再抓包。每换一个 App 就重来一遍，经验沉淀不下来。

这次尝试把它变成一份可复用的 Skill——输入是「App 版本号 + .har 抓包」，输出是三端可直接安装的插件。过程中踩的坑比预想多，其中几条还挺有普适性，记在这里。

---

## 一、先认清三端的差异：它们长得很像，但不能混写

Surge / Loon / Quantumult X 的语法高度相似，这是最容易出事的地方——凭印象写，一定会写错。

以「拦截一个 JSON 接口返回广告」为例：

```ini
# Surge (.sgmodule)
[Script]
demoapp-feed = type=http-response,pattern=^https?://api\.demoapp\.com/v1/feed/list,requires-body=true,max-size=2097152,script-path=https://cdn.example.com/demoapp-feed.js

[MITM]
hostname = %APPEND% api.demoapp.com
```

```ini
# Loon (.plugin)
[Script]
http-response ^https?://api\.demoapp\.com/v1/feed/list script-path=https://cdn.example.com/demoapp-feed.js, requires-body=true, tag=信息流去广告

[Mitm]
hostname = api.demoapp.com
```

```ini
# Quantumult X (.conf 片段)
[rewrite_local]
^https?://api\.demoapp\.com/v1/feed/list url script-response-body https://cdn.example.com/demoapp-feed.js

[mitm]
hostname = api.demoapp.com
```

同一个动作，三处关键差异：

|               | Surge                            | Loon                        | QuanX         |
| ------------- | -------------------------------- | --------------------------- | ------------- |
| 段名          | `[MITM]`                         | `[Mitm]`                    | `[mitm]`      |
| 追加主机      | `%APPEND%`                       | 直接列                      | 直接列        |
| 拒绝动作      | `_ reject`                       | `reject(403)` / 旧 `reject` | `reject`      |
| 1px 图        | `[Map Local] data-type=tiny-gif` | `reject_img(200)`           | `reject-img`  |
| 空 JSON       | `data-type=text data="{}"`       | `reject_dict(200)`          | `reject-dict` |
| JSON 原生改写 | `http-response-jq`               | `response.json.replace`     | 无            |

**结论**：脚本可以三端共用（共同子集只有 `$request` / `$response` / `$done`），但**插件配置必须三份**。指望一套语法通吃，是这类项目最早会遇到的幻觉。

---

## 二、一个被官方文档纠正的错误：版本门槛表达不了「中间版本」

这是本次最有价值的一条。

Surge 支持用 `#!requirement=CORE_VERSION>=20` 声明模块的版本要求。看起来只要写对数字就安全了。但查了官方版本映射表才发现：

| CORE_VERSION | 对应版本                  | 能力                                      |
| ------------ | ------------------------- | ----------------------------------------- |
| `20`         | Mac 5.6.0 / iOS 5.10.0    | Body Rewrite、Inline Map Local            |
| `22`         | Mac 5.7.0 / iOS 5.11.0    | Smart Group                               |
| `6008000`    | Mac 6.8.0 / iOS 5.21.0 起 | 改为 `major*1000000 + minor*1000 + patch` |

问题在于：**jq body rewrite 需要 iOS 5.14.0，而 5.14 没有对应的 CORE_VERSION 档位**。

所以下面这句是错的——它保证不了 jq 可用：

```ini
# ✗ 看起来严密，实际只保证「支持 Body Rewrite」
#!requirement=CORE_VERSION>=20

[Body Rewrite]
http-response-jq ^https?://conf\.demoapp\.com/v2/launch/config '.splash.enable = false'
```

正确做法是两条腿走路：`#!requirement` 只作为下限，真实版本要求写进 README；或者干脆改用 `[Script]`，绕开整个门槛问题。

> **可迁移的教训**：文档里出现「iOS X.Y+」只是一句功能声明，**能不能用元信息表达出来是另一回事**。中间版本往往落在档位空隙里，且失效表现是「规则被静默忽略」，零报错。

---

## 三、从 .har 取证：jq 配方与两个真实 bug

抓包分析是整个流程里最耗时的环节。整理下来，真正高频的只有六条命令。

### 3.1 谁在说话（主机分布）

```bash
jq -r '[.log.entries[].request.url
        | try capture("^https?://(?<h>[^/]+)").h catch "?"]
       | group_by(.) | map({h: .[0], n: length})
       | sort_by(-.n) | .[] | "\(.n)\t\(.h)"' target.har
```

### 3.2 按响应类型区分「配置」和「素材」

```bash
jq -r '.log.entries[]
  | [(.response.content.mimeType // "unknown"),
     (.response.content.size // 0 | tostring),
     .request.url] | @tsv' target.har \
| awk -F'\t' '{print $1}' | sort | uniq -c | sort -rn
```

`application/json` 走字段改写；`image/*` 走素材 Mock；`text/html` 走正文替换。路线不同，后面所有决策都从这里分叉。

### 3.3 全局搜字段（覆盖度检查的关键一步）

```bash
jq -r --arg f 'show_cta' '.log.entries[]
  | select((.response.content.text // "") | test($f))
  | [.request.url, (.response.content.mimeType // "-")] | @tsv' target.har | sort -u
```

一个字段命中两个接口，就说明有两处渲染面需要处理。这条命令的产出直接决定后面覆盖矩阵有几行。

### 3.4 写规则前必须验证 pattern 真的能命中

```bash
jq -r --arg re '^https?://api\.demoapp\.com/v1/feed/list' \
  '[.log.entries[] | select(.request.url | test($re))] | length' target.har
```

命中数为 0 就说明正则写错了——绝大多数「装上没反应」，都是这一步被跳过。

### 3.5 两个把配方打回重写的 bug

**bug 1：`fromjson` 用在了已经是 JSON 的文件上**

```bash
# ✗ 报错：object (...) only strings can be parsed
jq -r 'fromjson | [paths(scalars)] | .[] | map(tostring) | join(".")' feed.json

# ✓ 兼容两种输入
jq -r '(if type=="string" then fromjson else . end)
       | [paths(scalars)] | .[] | map(tostring) | join(".")' feed.json
```

**bug 2：`@base64d` 处理二进制不报错**

它不会抛异常，而是把非法字节**静默替换成 `�`**（U+FFFD）。所以判断标准不是「有没有报错」，而是「导出的文件里有没有成片乱码」。

```bash
jq -r '.log.entries[12].response.content
  | if .encoding == "base64" then (.text | @base64d) else (.text // "") end' \
  target.har > body.out
```

> **教训**：工具「不报错」不等于「做对了」。jq 在这两处的静默行为，都会让人以为数据是干净的。

---

## 四、决策树：先问「能不能不写脚本」

这是整个方法里省事最多的一步。很多需求看着必须写脚本，其实声明式就能覆盖。

```
抓到的请求
├─ 是图片 / 视频素材？
│   └─ 素材 Mock（1px 图）；该路径专供广告才考虑整路径 reject
├─ 响应是 JSON？
│   ├─ 广告 = 固定键（开关/配置）→ jq 改写 或 json.replace
│   ├─ 广告 = 数组里带标记的元素 → 必须脚本（原生动作不支持条件过滤数组）
│   └─ 整个响应体就是广告 → reject-dict 返回空 JSON，防解析崩溃
├─ 响应是 HTML 直出？
│   └─ 正则可稳定匹配 → 正文替换；否则注入样式隐藏（脆弱，需注明）
└─ protobuf / 加密 body？
    ├─ 能在请求侧做手脚（query/header/UA）→ 做
    └─ 不能 → 明确说「不可安全改写」，不硬做
```

**两个反直觉的点：**

- **「拒绝」比「Mock」风险高。** reject 返 404，App 可能判定网络异常并重试，甚至降级到备用广告源；返回结构正确的空 JSON 或 1px 图，App 会安静地当成「没有广告」。
- **整域名拒绝是最后手段。** 广告域名常与统计、CDN、图片服务共用，一刀切下来，副作用往往几天后才被发现。

---

## 五、两个对照示例：什么时候真的需要脚本

### 示例 A：信息流数组广告 —— 必须写脚本

接口返回里 `items` 是数组，广告是其中 `type == "ad"` 的元素。

- Surge 的 `http-response-jq` 能做，但要 iOS 5.14+
- Loon 的 `response.json.delete` 只能删固定键路径，**无法按条件过滤数组**
- QuanX 没有原生 JSON 动作

所以这里写一份脚本，三端共用：

```js
(function () {
  "use strict";
  const AD_TYPES = ["ad", "promote", "sponsor"];

  function main() {
    const body = $response && $response.body;
    if (!body) return $done({}); // 204/304：原样放行

    let obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      return $done({});
    } // 解析失败也要放行
    if (!obj || typeof obj !== "object" || !obj.data) return $done({});

    const data = obj.data;

    if (Array.isArray(data.items)) {
      data.items = data.items.filter(function (it) {
        if (!it || typeof it !== "object") return true;
        const t = String(it.type || "").toLowerCase();
        return AD_TYPES.indexOf(t) === -1 && it.is_ad !== true;
      });
    }
    if (data.banner) data.banner = null;
    if (data.ad_config && typeof data.ad_config === "object")
      data.ad_config.enable = false;

    return $done({ body: JSON.stringify(obj) });
  }

  main();
})();
```

每个 `return` 都是一道防线。少了 `if (!body)` 那行，对 204 响应强行返回 body 会直接断开连接；少了 `try/catch`，接口改版时会抛异常、不调 `$done`，请求挂起到超时，页面白屏。

### 示例 B：开屏广告 —— 一行脚本都不用

同样的需求，换成三个请求驱动的开屏：

| 请求                                  | 响应                         | 作用 |
| ------------------------------------- | ---------------------------- | ---- |
| `conf.demoapp.com/v2/launch/config`   | `{"splash":{"enable":true}}` | 开关 |
| `splash.demoapp.com/v1/get?slot=open` | JSON 广告数据                | 下发 |
| `img.demoapp.com/splash/0912.jpg`     | 图片                         | 素材 |

全是「固定键」或「整请求」，没有「按条件过滤集合」的需求。于是：

```ini
# Surge：一行 jq + 两个动作，无需托管脚本
[Body Rewrite]
http-response-jq ^https?://conf\.demoapp\.com/v2/launch/config '.splash.enable = false'

[URL Rewrite]
^https?://splash\.demoapp\.com/v1/get _ reject

[Map Local]
^https?://img\.demoapp\.com/splash/ data-type=tiny-gif
```

```ini
# Loon：原生动作，同样不需要脚本
[Rewrite]
response if ${url} ~= /^https?:\/\/conf\.demoapp\.com\/v2\/launch\/config/ && ${response.status} == 200 then response.json.replace("splash.enable", false)
request if ${url} ~= /^https?:\/\/splash\.demoapp\.com\/v1\/get/ then reject_dict(200)
request if ${url} ~= /^https?:\/\/img\.demoapp\.com\/splash\// then reject_img(200)
```

两相对照，就是这个方法最核心的判断：**先问「能不能不写脚本」，再动手写。顺序反了，就会产出一堆本可避免的依赖。**

脚本方案的下限是「用户得会传文件、有地方托管」，声明式方案的下限只是「复制一段文本」。

---

## 六、实现层的四个坑

规则写对只是及格线。下面四条是「装上之后才发现」的问题。

### 6.1 幂等：改两次必须等于改一次

脚本可能被重复执行（重试、刷新、手动重放）。基于状态写法的天然幂等，基于增量的会累积。

| 写法                                | 幂等              |
| ----------------------------------- | ----------------- |
| `obj.enable = false`                | ✅                |
| `obj.items = obj.items.filter(...)` | ✅                |
| `obj.count--`                       | ❌ 每跑一次少一   |
| `obj.items.push(x)`                 | ❌ 每跑一次多一条 |

本地自检不必装插件，用 node 连跑两次比对输出即可。这个测试还能抓出一类隐蔽事故：先 `JSON.parse` 再 `JSON.stringify` 导致**键顺序变化**，第二次输出与第一次字节不同——多数客户端不在意，但带签名的接口会因此失败。

### 6.2 缓存污染：改完 body，关掉插件反而更糟

App 收到改写后的响应，会写入本地数据库或磁盘缓存。于是关掉插件，界面仍是旧的；或者服务端下发正常数据，与本地脏数据打架。

由此得出一条设计原则：

> **优先改「服务端开关」，少改「客户端展示态」。**
> `splash.enable = false` 是让 App 自己决定不展示，撤掉规则一切复原；
> `banner = null` 是硬塞给客户端一个它没预期的状态，撤掉后可能留下脏数据。

交付时必须写明：**改 body 的规则，停用后建议清除 App 缓存**。不写，用户就会把缓存问题当成插件 bug。

### 6.3 分页游标：删数组元素最阴的坑

信息流接口常是 `items` + `cursor` 结构，而 cursor 是服务端按**完整列表**算出来的。删掉广告项之后：

- 拿旧 cursor 请求下一页 → 中间跳过正常内容
- 按 index 渲染 → 缓存 key 错位 → 内容重复
- 有长度校验的 App → 直接判定数据异常，停止加载

三种写法，风险递减：

| 写法                          | 风险         | 何时用                         |
| ----------------------------- | ------------ | ------------------------------ |
| 物理删除 `filter`             | 分页错乱     | 游标基于 id 且服务端不校验长度 |
| 原地降级（改 type、清空内容） | 出现空白卡片 | 客户端按 index 渲染            |
| 字段置空（保留结构）          | 可能有空壳   | **默认先试这一种**             |

> `filter` 是**最干净**的写法，但不是**最安全**的写法。分页场景下，干净和安全是冲突的。

验证方法很简单却很必要：翻 3 页，看有无重复、有无跳回、能否滑到底继续加载。

### 6.4 流式响应不能改 body

SSE（`text/event-stream`）、WebSocket 升级响应、长轮询，都没有「完整 body」这个概念。开 `requires-body` 会让客户端等一个永远不结束的 body——表现是**页面一直转圈，日志里一条错误都没有**。

只能做请求侧动作（改 header、整请求拒绝），不要试图改 body。

---

## 七、为什么规则写了却不生效：优先级与单链原则

同一 URL 被多条规则命中时，胜负由**处理阶段**决定，不由书写顺序决定。Surge 的顺序大致是：

```
① MITM 解密     hostname 不在列表 → 后续全部看不到
② [URL Rewrite] 改 URL / 拒绝
③ [Map Local]   命中即本地生成响应，不再发往上游
④ ── 上游响应返回 ──
⑤ [Body Rewrite] 先改 body
⑥ [Script]      拿到的是「已改写」的 body
⑦ [Header Rewrite]
```

三条硬约束（违反即静默失效）：

1. **一个响应只跑一条 `http-response` 脚本**——「第一条 pattern 匹配且已启用」的生效
2. **Body Rewrite 先于 Script**——脚本看到的是被 jq 改过的 body，想要原始 body 就得删掉 jq 规则
3. **Map Local 命中后不再请求上游**——不要和 Script 同时写在同一个 URL 上

> 「同一 URL 只保留一条处理链」是三端通用的原则。需要多个改动时，在**一个脚本内**完成，而不是加第二条规则。

另外两端：Loon 同 phase 内按配置顺序执行，来源优先级 **本地配置 > 插件**；QuanX `[rewrite_local]` 先于 `[rewrite_remote]`。排障时先问一句「你是不是另外配过」，能省很多时间。

---

## 八、怎么证明它生效了：四层定位

「装了没效果」是最常见的反馈。给一条可执行的路径，比让用户描述现象有效得多。

```
图标 / 日志都没有         → MITM 层：hostname 覆盖了吗？证书信任了吗？
有图标但 body 没变        → pattern 层：正则精确吗？
body 变了但界面没变       → 客户端层：读了缓存，或改的字段不是渲染源
body 变了界面也变了但广告仍在 → 多点驱动（配置 + 素材都要处理）
```

顺序不能跳，跳了就会在错误的层里改规则。

两个有用的诊断线索：

- **证书固定（pinning）**：客户端完成 TLS 握手后**不发请求就断开**，Surge 会在日志里提示该域名很可能启用了 pinning。这种情况下规则永远不可能生效。
- **HTTP/3 绕过**：App 走 QUIC 时 MITM 可能压根不生效。Surge 的 `auto-quic-block` 默认开启（iOS 5.8.0+），会自动阻断命中 MITM 列表的 QUIC 连接，让客户端回退到 HTTP/2。用户手动关过这个开关，表现就是「部分请求抓不到」。

---

## 九、让它活得久：编号、体检、索引

插件交出去只是开始。真正的成本在「三个版本之后」。

### 9.1 每条规则都要编号

```ini
# [S1] A级 · 依赖 data.items[].type · 失效信号：广告卡片重现
```

配套一张表，写清级别、依赖、**失效信号**、复核方法。失效信号必须是**用户能看见的现象**（「广告卡片重现」），不能写技术描述（「字段不匹配」）——否则没法从抱怨反查规则。

### 9.2 体检脚本

App 每次升级后重抓一轮 HAR，把规则表里的 ID + 正则逐条跑一遍：

```bash
#!/usr/bin/env bash
# check-rules.sh <new.har> <rules.txt>
set -u
HAR="${1:?usage: check-rules.sh <new.har> <rules.txt>}"
RULES="${2:?usage: check-rules.sh <new.har> <rules.txt>}"

total=0; miss=0
while read -r id re || [ -n "${id:-}" ]; do
  case "$id" in ''|\#*) continue ;; esac
  [ -z "${re:-}" ] && continue
  total=$((total+1))
  n=$(jq --arg re "$re" '[.log.entries[] | select(.request.url | test($re))] | length' "$HAR" 2>/dev/null || echo ERR)
  if [ "$n" = "ERR" ]; then
    echo "! $id  正则语法错误  ← $re"; miss=$((miss+1))
  elif [ "$n" -eq 0 ]; then
    echo "✗ $id  命中 0  ← 可疑失效: $re"; miss=$((miss+1))
  else
    echo "✓ $id  命中 $n"
  fi
done < "$RULES"
echo "----"; echo "共 $total 条，可疑 $miss 条"
```

它区分了两种失败：**零命中**（接口没了）和**正则写错**（自己手滑）。这两种在旧流程里会混成一句「不生效」。

**但记住：命中 ≠ 有效。** 命中只证明接口还在，不证明字段还在，对通过项仍要抽一条导出 body 复核。

### 9.3 跨 App 索引

规则多了之后，「某个 App 又有广告了」会变成高频问题。维护一份索引，记录 App、版本、规则 ID、失效信号，就能把两类问题分开：

|      | 旧规则失效  | 新增广告位                |
| ---- | ----------- | ------------------------- |
| 位置 | 和以前一样  | 页面里多了一块            |
| 处置 | 改正则/字段 | **新增规则 ID**，重新画像 |
| 耗时 | 10 分钟     | 可能改变整体技术路线      |

误判代价不对称：把「新增位置」当「旧规则失效」处理，会一直去改一条本来没问题的规则，越改越乱。

> 索引只记录「当时为什么这么写」，不记录「现在应该怎么改」。后者属于插件文件和文档，混进来会让记忆变成第二个真相源。

---

## 十、从去广告到界面裁剪：需求边界才是难点

后来需求扩展到「按字段隐藏对应界面和按钮」。这看似是同一类工作，失败方式却完全不同。

|          | 去广告     | 界面裁剪                           |
| -------- | ---------- | ---------------------------------- |
| 成功标准 | 广告看不见 | 入口全消失，**而且别处也没有**     |
| 典型失败 | 误杀主业务 | **漏掉渲染面**（用户："这里还有"） |
| 前置产出 | 候选请求表 | **隐藏范围清单**                   |

半覆盖的代价是会复利的：

```
改了一个渲染面 → 用户切页面又看见 → 「你不是说好了吗」
→ 信任打折 → 重新抓包、重新定界、重新验收 → 成本翻倍
```

所以定了一条硬规则：**要么把范围枚举完并全部实现，要么明确说出哪一项做不到、为什么。中间状态是唯一不可接受的交付。**

### 10.1 定界三问

1. **隐藏入口，还是关闭功能？** 入口没了，深链、推送、搜索结果仍可能把用户送进同一页面。
2. **「范围」包含哪些渲染面？** 列表、详情、搜索、个人中心、推送落地页、设置页——逐项确认，不要替用户决定。
3. **该区域留白、塌陷重排，还是占位替代？** 不问这条就删元素，最常见结果是页面中间空一块。

### 10.2 「必须实现」怎么落地成可判定

「凡技术上可实现的都必须实现」需要一张判定表，否则会被「这个比较麻烦」糊过去：

| 情形                          | 结论                               |
| ----------------------------- | ---------------------------------- |
| 同一字段出现在多个接口        | 必须全部覆盖                       |
| 存在服务端开关字段            | 必须优先关开关（可逆、无缓存污染） |
| 有 A/B 灰度，两种返回结构     | 必须同时覆盖两条分支               |
| 需改 protobuf / 加密 body     | 不可实现，明确说明并给替代         |
| 界面是原生硬编码，无网络交互  | 不可实现，**不要假装修好了**       |
| 隐藏会破坏主流程（支付/登录） | 不做，说明风险后由用户定           |

> **「不做」只有两种合法理由：技术上不可实现，或会破坏主流程。**
> 除此之外一律必须实现——「要写脚本」「比较麻烦」「估计用户不会去那个页面」都不算理由。

### 10.3 验收要含反向项

只验「该消失的都消失了」等于只验了一半。完整的验收有三组：

- **正向**：列表/详情/搜索/个人中心/深链/冷启动/未登录态，逐项确认不出现
- **反向**：相邻功能可点、翻页正常、布局无塌陷、周边交互不报错
- **跨端**：三端表现一致；关闭插件后能复原（前提是已清缓存）

用户要的是「这个没了、其他照旧」，不是「这个没了，页面也废了」。

---

## 十一、关于引用官方文档：一次取舍

Skill 里要不要内置官方文档链接？结论是**要，但写法比写不写重要**。

第一版把链接写进去，仍然写错了一处——因为有链接不等于读透了那一节（就是第二节的 `CORE_VERSION` 问题）。所以真正的要点是**带着问题去读**，并且知道该读哪一小节。

几条实践下来有用的做法：

- 写「路径 + 用途 + 重点看哪一节」，不要裸 URL 列表
- 根域稳定 + 相对路径，改版后还能从导航找回
- 标注核验日期、分权威等级（官方手册 / 官方仓库 / 社区写法 / 博客）
- 写明**降级顺序**：换语言版 → 回根域 → 站内搜 → 查版本说明 → 判定为「不存在」
- 关键语法必须内联成表，链接只做溯源——断网时仍要能产出八成正确结果

另外，链接会腐坏。研究期间就撞了三个 404（`/module/`、`/modules.html`、`/http-processing/url-rewrite.html`），而真实路径是 `/profile/module.html`、`/http/url-rewrite.html`。这些都是「凭记忆写的 URL」。

**最后的取舍**：不存文档快照，一律运行时现查。宁可每次多花一次抓取，也不要拿到一份过期的语法。代价是断网零兜底，所以内联层必须足够厚。

---

## 十二、几条可迁移的原则

写给以后的自己：

1. **证据优先。** 每一条规则都要能在抓包里指出对应的请求。没有证据的 pattern 不进插件。
2. **能不写脚本就不写。** 脚本多一次 body 缓冲、多一份托管、多一处失效点。先问「声明式能不能覆盖」。
3. **「不报错」不等于「成功」。** jq 的 `@base64d`、客户端的版本门槛、超限的 `max-size`——三处都是静默失败。
4. **半覆盖比不覆盖更糟。** 用户会以为已经好了，然后在下一个页面撞见同一块东西。
5. **优先改开关，少改展示态。** 可逆的改动撤得掉，硬塞的状态会留下脏数据。
6. **规则越巧，坏得越快。** 依赖的假设越多，失效概率越高。一行 `reject` 能表达的，不要用二十行脚本。
7. **维护成本要反过来约束设计。** 一条规则让你每版都得动，那它是技术债，不是功能。

最后一条是最容易被忽略的。写插件的时候只想着「怎么让它生效」，很少想「三个月后它还成立吗」——而后者才决定这东西是一次性劳动，还是可积累的资产。

---

## 附：文件下载

- Skill 包（`SKILL.md` + `registry.md`）：[点击下载](https://www.xn--ci8h.cc.cd/assets/iOS-adblock-skill.zip)

<script lang="ts">
  import videoDetailData from "../test_data/video_detail.json";
  import { sanitizeRichText } from "../lib/sanitize";

  export let vodId: string | number = "";

  type EpisodeItem = {
    label: string;
    url: string;
  };

  type VideoDetailItem = Record<string, any>;

  let detail: VideoDetailItem | null = null;
  let episodes: EpisodeItem[] = [];
  let loading = true;
  let error = "";
  let synopsis = "";

  const normalizeM3u8Url = (value = "") => {
    if (!value) return "";
    const trimmed = value.trim();

    if (trimmed.endsWith(".m3u8")) {
      return trimmed;
    }

    if (trimmed.includes(".m3u8")) {
      return trimmed.split(".m3u8")[0] + ".m3u8";
    }

    if (trimmed.includes("/share/")) {
      return `${trimmed}.m3u8`;
    }

    return trimmed;
  };

  const parseEpisodes = (raw = "") => {
    if (!raw) return [];

    return raw
      .split("#")
      .filter(Boolean)
      .map((segment) => {
        const [label, ...rest] = segment.split("$");
        const url = normalizeM3u8Url(rest.join("$"));

        return {
          label: label || "播放",
          url: url || "",
        };
      })
      .filter((item) => item.url);
  };

  // 数据已作为模块随包加载，无需序列化后经 data: URL 往返
  const fetchVideoDetail = () => {
    loading = true;
    error = "";

    try {
      const list: VideoDetailItem[] = Array.isArray(videoDetailData?.list)
        ? (videoDetailData.list as VideoDetailItem[])
        : [];
      const matched = list.find(
        (item) => String(item.vod_id) === String(vodId),
      );

      if (!matched) {
        throw new Error("未找到对应视频");
      }

      detail = matched;
      episodes = parseEpisodes(matched.vod_play_url || "");
    } catch (err) {
      error = err instanceof Error ? err.message : "获取详情失败";
      detail = null;
      episodes = [];
    } finally {
      loading = false;
    }
  };

  // 单处触发：首次挂载与 vodId 变化都走这条响应式语句，避免重复请求
  $: if (vodId) {
    fetchVideoDetail();
  }

  $: synopsis = detail
    ? sanitizeRichText(detail.vod_content) ||
      sanitizeRichText(detail.vod_blurb) ||
      "暂无简介"
    : "";
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
  {#if loading}
    <div
      class="animate-pulse space-y-5 rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      <div class="h-72 rounded-3xl       bg-slate-200"></div>
      <div class="h-6 w-1/3 rounded bg-slate-200"></div>
      <div class="h-4 w-2/3 rounded bg-slate-200"></div>
      <div class="h-4 w-1/2 rounded bg-slate-200"></div>
    </div>
  {:else if error}
    <div
      class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-600"
    >
      {error}
    </div>
  {:else if detail}
    <div
      class="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div class="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <img
          src={detail.vod_pic ||
            "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80"}
          alt={detail.vod_name}
          class="h-72 w-full rounded-[22px] object-cover"
        />

        <div>
          <div
            class="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"
          >
            <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-600"
              >{detail.type_name}</span
            >
            <span
              class="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600"
              >{detail.vod_remarks}</span
            >
          </div>

          <h1 class="mb-3 text-3xl font-bold text-slate-800">
            {detail.vod_name}
          </h1>
          <p class="mb-5 text-sm text-slate-600">
            {detail.vod_sub || detail.vod_blurb}
          </p>

          <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <span class="font-medium text-slate-800">导演：</span
              >{detail.vod_director || "-"}
            </div>
            <div>
              <span class="font-medium text-slate-800">主演：</span
              >{detail.vod_actor || "-"}
            </div>
            <div>
              <span class="font-medium text-slate-800">地区：</span
              >{detail.vod_area || "-"}
            </div>
            <div>
              <span class="font-medium text-slate-800">语言：</span
              >{detail.vod_lang || "-"}
            </div>
            <div>
              <span class="font-medium text-slate-800">更新：</span
              >{detail.vod_remarks || "-"}
            </div>
            <div>
              <span class="font-medium text-slate-800">年份：</span
              >{detail.vod_year || "-"}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="mb-4 text-xl font-semibold text-slate-800">播放列表</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {#each episodes as episode, index}
            <a
              href={`/videos/player/${detail.vod_id}-${index + 1}`}
              class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {episode.label}
            </a>
          {/each}
        </div>
      </div>

      <div class="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 class="mb-3 text-lg font-semibold text-slate-800">简介</h3>
        <div class="prose max-w-none text-sm leading-7 text-slate-600">
          <!-- 已经 sanitizeRichText 白名单净化，仅保留安全标签且无属性 -->
          {@html synopsis}
        </div>
      </div>
    </div>
  {/if}
</div>

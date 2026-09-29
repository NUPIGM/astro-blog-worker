<script lang="ts">
  import { onMount } from "svelte";
  import videoDetailData from "../test_data/video_detail.json";

  export let vodId: string | number = "";

  type EpisodeItem = {
    label: string;
    url: string;
  };

  let detail: any = null;
  let episodes: EpisodeItem[] = [];
  let loading = true;
  let error = "";

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

  const readFixture = async <T,>(fixture: T): Promise<T> => {
    const payload = encodeURIComponent(JSON.stringify(fixture));
    const response = await fetch(
      `data:application/json;charset=utf-8,${payload}`,
    );

    if (!response.ok) {
      throw new Error("请求失败");
    }

    return response.json();
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

  const fetchVideoDetail = async () => {
    loading = true;
    error = "";

    try {
      const data = await readFixture(videoDetailData);
      const list = Array.isArray(data?.list) ? data.list : [];
      const matched = list.find(
        (item: any) => String(item.vod_id) === String(vodId),
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

  onMount(() => {
    if (vodId) fetchVideoDetail();
  });

  $: if (vodId) {
    fetchVideoDetail();
  }
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
  {#if loading}
    <div
      class="animate-pulse space-y-5 rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      <div class="h-72 rounded-[24px] bg-slate-200"></div>
      <div class="h-6 w-1/3 rounded bg-slate-200"></div>
      <div class="h-4 w-2/3 rounded bg-slate-200"></div>
      <div class="h-4 w-1/2 rounded bg-slate-200"></div>
    </div>
  {:else if error}
    <div
      class="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-red-600"
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

      <div class="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        <h3 class="mb-3 text-lg font-semibold text-slate-800">简介</h3>
        <div class="prose max-w-none text-sm leading-7 text-slate-600">
          {@html detail.vod_content || detail.vod_blurb || "暂无简介"}
        </div>
      </div>
    </div>
  {/if}
</div>

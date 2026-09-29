<script lang="ts">
  import { onMount } from "svelte";
  import videoListData from "../test_data/video_list.json";

  type VideoItem = {
    vod_id: number;
    vod_name: string;
    type_name: string;
    vod_remarks: string;
    vod_time: string;
    vod_pic?: string;
  };

  let keyword = "";
  let videos: VideoItem[] = [];
  let loading = false;
  let error = "";

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

  const fetchVideos = async (query = "") => {
    const data = await readFixture(videoListData);
    const list = Array.isArray(data?.list) ? data.list : [];
    const q = query.trim().toLowerCase();

    if (!q) {
      return list;
    }

    return list.filter((item: VideoItem) =>
      [item.vod_name, item.type_name, item.vod_remarks, item.vod_time]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  };

  const handleSearch = async () => {
    loading = true;
    error = "";

    try {
      videos = await fetchVideos(keyword);
    } catch (err) {
      error = err instanceof Error ? err.message : "搜索失败";
      videos = [];
    } finally {
      loading = false;
    }
  };

  const formatDate = (value: string) => (value ? value.split(" ")[0] : "-");

  onMount(() => {
    handleSearch();
  });
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
  <div class="glass-panel mb-8 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
    <div class="flex flex-col gap-3 md:flex-row md:items-center">
      <input
        bind:value={keyword}
        type="text"
        placeholder="输入片名 / 类型 / 备注"
        class="glass-input h-12 flex-1 px-5 text-sm text-slate-700 outline-none transition placeholder:text-slate-500 focus:border-indigo-300"
        on:keydown={(event) => {
          if (event.key === "Enter") handleSearch();
        }}
      />
      <button
        type="button"
        on:click={handleSearch}
        disabled={loading}
        class="glass-button h-12 rounded-full bg-gradient-to-r from-indigo-500/90 to-violet-500/90 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.4)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "搜索中..." : "搜索"}
      </button>
    </div>
  </div>

  {#if error}
    <div class="glass-error mb-6 px-4 py-3 text-sm text-red-600">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each Array(6) as _, index (index)}
        <div class="glass-skeleton animate-pulse p-3">
          <div class="mb-3 h-48 rounded-2xl bg-white/20"></div>
          <div class="mb-2 h-4 w-2/3 rounded bg-white/20"></div>
          <div class="h-3 w-1/2 rounded bg-white/20"></div>
        </div>
      {/each}
    </div>
  {:else if videos.length === 0}
    <div class="glass-empty p-10 text-center text-slate-500">暂无匹配结果</div>
  {:else}
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each videos as item}
        <a
          href={`/videos/${item.vod_id}`}
          class="glass-card group overflow-hidden transition duration-300 hover:-translate-y-1"
        >
          <div class="relative overflow-hidden">
            <img
              src={item.vod_pic ||
                "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80"}
              alt={item.vod_name}
              class="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span
              class="absolute right-3 top-3 rounded-full bg-slate-900/50 px-2.5 py-1 text-[10px] font-medium text-white ring-1 ring-white/15 backdrop-blur-sm"
            >
              {item.type_name}
            </span>
          </div>

          <div class="p-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="line-clamp-2 text-lg font-semibold text-slate-800">
                {item.vod_name}
              </h3>
            </div>

            <div class="mb-3 flex items-center gap-2 text-xs text-slate-500">
              <span
                class="rounded-full bg-indigo-50/90 px-2 py-1 text-indigo-600 ring-1 ring-indigo-100"
                >{item.vod_remarks}</span
              >
            </div>

            <div
              class="flex items-center justify-between text-xs text-slate-500"
            >
              <span>{formatDate(item.vod_time)}</span>
              <span class="text-indigo-600 group-hover:text-violet-600"
                >查看详情 →</span
              >
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background: radial-gradient(
        circle at top left,
        rgba(191, 219, 254, 0.8),
        transparent 28%
      ),
      radial-gradient(
        circle at bottom right,
        rgba(216, 180, 254, 0.45),
        transparent 24%
      ),
      linear-gradient(135deg, #f8fafc 0%, #eef2ff 35%, #f5f3ff 100%);
  }

  .glass-panel,
  .glass-card,
  .glass-skeleton,
  .glass-empty,
  .glass-error {
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.45);
    box-shadow:
      0 20px 50px rgba(15, 23, 42, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      inset 0 -1px 0 rgba(148, 163, 184, 0.08);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .glass-panel {
    border-radius: 28px;
  }

  .glass-card {
    border-radius: 24px;
    overflow: hidden;
    display: block;
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .glass-input {
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .glass-button {
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 14px 28px rgba(99, 102, 241, 0.28);
  }

  .glass-empty,
  .glass-error {
    border-radius: 24px;
    padding: 2.5rem 1.5rem;
  }

  .glass-skeleton {
    border-radius: 22px;
  }
</style>

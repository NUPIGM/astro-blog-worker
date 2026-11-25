(() => {
  // 创建顶部进度条
  const progress = document.createElement("div");
  progress.id = "page-progress";
  document.documentElement.appendChild(progress);

  let resetTimeout: number | undefined;

  const startProgress = () => {
    window.clearTimeout(resetTimeout);
    progress.classList.remove("finish");
    progress.style.width = "0%";

    requestAnimationFrame(() => {
      progress.classList.add("active");
      progress.style.width = "70%";
    });
  };

  const finishProgress = () => {
    progress.classList.remove("active");
    progress.classList.add("finish");
    progress.style.width = "100%";

    resetTimeout = window.setTimeout(() => {
      progress.classList.remove("finish");
      progress.style.width = "0%";
    }, 500);
  };

  document.addEventListener("astro:before-preparation", startProgress);
  document.addEventListener("astro:page-load", finishProgress);

  // 页面加载或从缓存恢复时重置
  window.addEventListener("pageshow", () => {
    window.clearTimeout(resetTimeout);
    progress.classList.remove("active", "finish");
    progress.style.width = "0%";
  });
})();
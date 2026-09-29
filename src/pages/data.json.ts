// 输出：/builtwith.json
export function POST({ params, request }) {
  return new Response(
    JSON.stringify({
      name: "Astro",
      url: "https://astro.build/",
    }),
  );
}

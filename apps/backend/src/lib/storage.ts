export function extractStorageKey(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  if (base && url.startsWith(base + "/")) return url.slice(base.length + 1);
  const match = url.match(/\/api\/storage\/(.+)$/);
  if (match) return match[1]!;
  return url;
}

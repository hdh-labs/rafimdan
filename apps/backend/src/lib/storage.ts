export function extractStorageKey(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  if (base && url.startsWith(base + "/")) return url.slice(base.length + 1);
  const match = url.match(/\/api\/storage\/(.+)$/);
  if (match) return match[1]!;
  return url;
}

export function getStorageBaseUrl(storagePublicUrl: string | undefined): string {
  return (storagePublicUrl ?? "").replace(/\/$/, "") || "/api/storage";
}

export function getStorageUrl(storagePublicUrl: string | undefined, key: string): string {
  return `${getStorageBaseUrl(storagePublicUrl)}/${key}`;
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
};

export function generateSlug(text: string): string {
  return text
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function findUniqueSlug(
  db: D1Database,
  table: "users" | "listings",
  base: string,
): Promise<string> {
  const slug = generateSlug(base);
  const existing = await db
    .prepare(`SELECT slug FROM ${table} WHERE slug = ?`)
    .bind(slug)
    .first<{ slug: string }>();

  if (!existing) return slug;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${slug}-${i}`;
    const taken = await db
      .prepare(`SELECT slug FROM ${table} WHERE slug = ?`)
      .bind(candidate)
      .first<{ slug: string }>();
    if (!taken) return candidate;
  }

  return `${slug}-${Date.now()}`;
}

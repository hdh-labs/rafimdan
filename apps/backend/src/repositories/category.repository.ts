import type { CategoryRow, CategoryTree } from "@rafimdan/shared";

export const categoryRepository = {
  async findAll(db: D1Database): Promise<CategoryRow[]> {
    const result = await db
      .prepare("SELECT * FROM categories ORDER BY sort_order ASC, name ASC")
      .all<CategoryRow>();
    return result.results ?? [];
  },

  async findById(db: D1Database, id: string): Promise<CategoryRow | null> {
    return db.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first<CategoryRow>();
  },

  async findBySlug(db: D1Database, slug: string): Promise<CategoryRow | null> {
    return db
      .prepare("SELECT * FROM categories WHERE slug = ?")
      .bind(slug)
      .first<CategoryRow>();
  },

  toTree(rows: CategoryRow[]): CategoryTree[] {
    const parents = rows.filter((r) => r.parent_id === null);
    return parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      children: rows
        .filter((r) => r.parent_id === parent.id)
        .map((child) => ({ id: child.id, name: child.name, slug: child.slug })),
    }));
  },
} as const;

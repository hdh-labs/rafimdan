import type { User, UserProfile, AdminUserProfile, CreateUserInput } from "@rafimdan/shared";

export const userRepository = {
  async findById(db: D1Database, id: string): Promise<User | null> {
    return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();
  },

  async findByGoogleId(db: D1Database, googleId: string): Promise<User | null> {
    return db
      .prepare("SELECT * FROM users WHERE google_id = ?")
      .bind(googleId)
      .first<User>();
  },

  async findBySlug(db: D1Database, slug: string): Promise<User | null> {
    return db.prepare("SELECT * FROM users WHERE slug = ?").bind(slug).first<User>();
  },

  async create(db: D1Database, input: CreateUserInput): Promise<User> {
    await db
      .prepare(
        `INSERT INTO users (id, google_id, name, slug, avatar_url)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(input.id, input.google_id, input.name, input.slug, input.avatar_url ?? null)
      .run();

    return (await userRepository.findById(db, input.id))!;
  },

  async findAll(db: D1Database): Promise<User[]> {
    const result = await db.prepare("SELECT * FROM users ORDER BY created_at DESC").all<User>();
    return result.results ?? [];
  },

  async findAllWithStats(db: D1Database): Promise<Array<User & { listing_count: number }>> {
    const result = await db
      .prepare(
        `SELECT u.*, COALESCE(COUNT(l.id), 0) as listing_count
         FROM users u
         LEFT JOIN listings l ON l.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
      )
      .all<User & { listing_count: number }>();
    return result.results ?? [];
  },

  async update(
    db: D1Database,
    id: string,
    input: Partial<Pick<User, "display_name" | "whatsapp" | "city" | "district" | "bio" | "slug" | "avatar_url" | "is_admin" | "is_active">>,
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.display_name !== undefined) { fields.push("display_name = ?"); values.push(input.display_name); }
    if (input.whatsapp !== undefined) { fields.push("whatsapp = ?"); values.push(input.whatsapp); }
    if (input.city !== undefined) { fields.push("city = ?"); values.push(input.city); }
    if (input.district !== undefined) { fields.push("district = ?"); values.push(input.district); }
    if (input.bio !== undefined) { fields.push("bio = ?"); values.push(input.bio); }
    if (input.slug !== undefined) { fields.push("slug = ?"); values.push(input.slug); }
    if (input.avatar_url !== undefined) { fields.push("avatar_url = ?"); values.push(input.avatar_url); }
    if (input.is_admin !== undefined) { fields.push("is_admin = ?"); values.push(input.is_admin); }
    if (input.is_active !== undefined) { fields.push("is_active = ?"); values.push(input.is_active); }

    if (fields.length === 0) return userRepository.findById(db, id);

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db
      .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return userRepository.findById(db, id);
  },

  async deleteById(db: D1Database, id: string): Promise<void> {
    await db.prepare("DELETE FROM listings WHERE user_id = ?").bind(id).run();
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  },

  async updateLastLogin(db: D1Database, id: string): Promise<void> {
    await db
      .prepare("UPDATE users SET updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();
  },

  toProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      whatsapp: user.whatsapp,
      city: user.city,
      district: user.district,
      bio: user.bio,
      slug: user.slug,
      is_active: user.is_active,
      is_admin: user.is_admin,
      created_at: user.created_at,
    };
  },

  toAdminProfile(user: User & { listing_count: number }): AdminUserProfile {
    return {
      id: user.id,
      name: user.name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      whatsapp: user.whatsapp,
      city: user.city,
      district: user.district,
      bio: user.bio,
      slug: user.slug,
      is_active: user.is_active,
      is_admin: user.is_admin,
      created_at: user.created_at,
      listing_count: user.listing_count,
    };
  },
} as const;

export const favoriteRepository = {
  async add(db: D1Database, userId: string, listingId: string): Promise<void> {
    await db
      .prepare(
        "INSERT INTO favorites (id, user_id, listing_id) VALUES (?, ?, ?)",
      )
      .bind(crypto.randomUUID(), userId, listingId)
      .run();
  },

  async remove(db: D1Database, userId: string, listingId: string): Promise<void> {
    await db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND listing_id = ?")
      .bind(userId, listingId)
      .run();
  },

  async exists(db: D1Database, userId: string, listingId: string): Promise<boolean> {
    const row = await db
      .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?")
      .bind(userId, listingId)
      .first();
    return row !== null;
  },

  async findListingIdsByUserId(db: D1Database, userId: string): Promise<string[]> {
    const rows = await db
      .prepare("SELECT listing_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
      .bind(userId)
      .all<{ listing_id: string }>();
    return (rows.results ?? []).map((r) => r.listing_id);
  },
} as const;

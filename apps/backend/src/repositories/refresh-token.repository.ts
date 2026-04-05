import type { CreateRefreshTokenInput } from "@rafimdan/shared";

type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
};

export const refreshTokenRepository = {
  async create(db: D1Database, input: CreateRefreshTokenInput): Promise<void> {
    await db
      .prepare(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(input.id, input.user_id, input.token_hash, input.expires_at)
      .run();
  },

  async findByTokenHash(db: D1Database, hash: string): Promise<RefreshTokenRow | null> {
    return db
      .prepare("SELECT * FROM refresh_tokens WHERE token_hash = ?")
      .bind(hash)
      .first<RefreshTokenRow>();
  },

  async deleteByTokenHash(db: D1Database, hash: string): Promise<void> {
    await db
      .prepare("DELETE FROM refresh_tokens WHERE token_hash = ?")
      .bind(hash)
      .run();
  },

  async deleteAllByUserId(db: D1Database, userId: string): Promise<void> {
    await db
      .prepare("DELETE FROM refresh_tokens WHERE user_id = ?")
      .bind(userId)
      .run();
  },
} as const;

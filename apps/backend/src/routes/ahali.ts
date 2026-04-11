import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { authMiddleware } from "../middleware/auth";
import { userRepository } from "../repositories/user.repository";

const ahali = new Hono<HonoEnv>();

ahali.post("/join", authMiddleware, async (c) => {
  const body = await c.req.json<{ token: string }>().catch(() => ({ token: "" }));
  if (!body.token || body.token !== c.env.AHALI_INVITE_TOKEN) {
    return c.json({ error: "Geçersiz davet kodu", status: "error", code: "INVALID_TOKEN" }, 403);
  }
  const { sub } = c.get("user");
  await userRepository.update(c.env.DB, sub, { is_ahali: 1 });
  return c.json({ data: null, status: "ok" });
});

ahali.get("/stats", async (c) => {
  const memberRow = await c.env.DB
    .prepare("SELECT COUNT(*) as count FROM users WHERE is_ahali = 1")
    .first<{ count: number }>();

  const listingRow = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM listings l
       JOIN users u ON u.id = l.user_id
       WHERE l.status = 'active' AND u.is_ahali = 1`,
    )
    .first<{ count: number }>();

  return c.json({
    data: {
      member_count: memberRow?.count ?? 0,
      listing_count: listingRow?.count ?? 0,
    },
    status: "ok",
  });
});

export default ahali;

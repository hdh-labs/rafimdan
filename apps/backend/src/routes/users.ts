import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { userRepository } from "../repositories/user.repository";
import { listingService } from "../services/listing.service";
import { handleError } from "../lib/handle-error";

const users = new Hono<HonoEnv>();

users.get("/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const user = await userRepository.findBySlug(c.env.DB, slug);

    if (!user || !user.is_active) {
      return c.json({ error: "Kullanıcı bulunamadı", status: "error", code: "USER_NOT_FOUND" }, 404);
    }

    const [listings, stats] = await Promise.all([
      listingService.getByUser(c.env.DB, slug),
      listingService.getStatsByUserId(c.env.DB, user.id),
    ]);

    const { whatsapp: _whatsapp, ...publicProfile } = userRepository.toProfile(user);
    return c.json({
      data: {
        profile: {
          ...publicProfile,
          listing_count: stats.active_count,
          sold_count: stats.sold_count,
        },
        listings,
      },
      status: "ok",
    });
  } catch (err) {
    return handleError(c, err);
  }
});

export default users;

import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { userRepository } from "../repositories/user.repository";
import { listingService } from "../services/listing.service";
import { AppError } from "../errors";

const users = new Hono<HonoEnv>();

users.get("/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const user = await userRepository.findBySlug(c.env.DB, slug);

    if (!user || !user.is_active) {
      return c.json({ error: "Kullanıcı bulunamadı", status: "error", code: "USER_NOT_FOUND" }, 404);
    }

    const listings = await listingService.getByUser(c.env.DB, slug);

    return c.json({
      data: {
        profile: userRepository.toProfile(user),
        listings,
      },
      status: "ok",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 500);
    }
    throw err;
  }
});

export default users;

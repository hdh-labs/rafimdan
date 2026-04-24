import { Hono } from "hono"
import type { HonoEnv } from "../types/env"
import { authMiddleware } from "../middleware/auth"
import { notificationRepository } from "../repositories/notification.repository"
import { handleError } from "../lib/handle-error"

const notifications = new Hono<HonoEnv>()

notifications.get("/", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user")
    const [items, unread_count] = await Promise.all([
      notificationRepository.findByUserId(c.env.DB, sub),
      notificationRepository.countUnread(c.env.DB, sub),
    ])
    return c.json({ data: { items, unread_count }, status: "ok" })
  } catch (err) {
    return handleError(c, err)
  }
})

notifications.patch("/read", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user")
    await notificationRepository.markAllRead(c.env.DB, sub)
    return c.json({ data: null, status: "ok" })
  } catch (err) {
    return handleError(c, err)
  }
})

export default notifications

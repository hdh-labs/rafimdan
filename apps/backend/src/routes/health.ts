import { Hono } from "hono";
import type { HonoEnv } from "../types/env";

const health = new Hono<HonoEnv>();

health.get("/", (c) => {
  return c.json({ data: { ok: true }, status: "ok" });
});

export default health;

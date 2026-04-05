import { Hono } from "hono";
import type { HonoEnv } from "../types/env";

const storage = new Hono<HonoEnv>();

storage.get("/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/storage\//, "");
  if (!key) return c.json({ error: "Not Found", status: "error", code: "NOT_FOUND" }, 404);

  const object = await c.env.STORAGE.get(key);
  if (!object) return c.json({ error: "Not Found", status: "error", code: "NOT_FOUND" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

export default storage;

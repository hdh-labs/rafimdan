import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { categoryService } from "../services/category.service";
import { handleError } from "../lib/handle-error";

const categories = new Hono<HonoEnv>();

categories.get("/", async (c) => {
  try {
    const tree = await categoryService.getAll(c.env.DB);
    c.header("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    return c.json({ data: tree, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default categories;

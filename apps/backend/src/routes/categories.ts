import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { categoryService } from "../services/category.service";
import { AppError } from "../errors";

const categories = new Hono<HonoEnv>();

categories.get("/", async (c) => {
  try {
    const tree = await categoryService.getAll(c.env.DB);
    return c.json({ data: tree, status: "ok" });
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 500);
    }
    throw err;
  }
});

export default categories;

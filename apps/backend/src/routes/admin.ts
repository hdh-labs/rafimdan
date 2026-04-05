import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/env";
import { reportService } from "../services/report.service";
import { AppError } from "../errors";

const admin = new Hono<HonoEnv>();

const apiKeyMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const key = c.req.header("x-admin-key");
  if (!key || key !== c.env.ADMIN_API_KEY) {
    return c.json({ error: "Unauthorized", status: "error", code: "UNAUTHORIZED" }, 401);
  }
  return next();
};

admin.get("/reports", apiKeyMiddleware, async (c) => {
  try {
    const reports = await reportService.getAll(c.env.DB);
    return c.json({ data: reports, status: "ok" });
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 500);
    }
    throw err;
  }
});

export default admin;

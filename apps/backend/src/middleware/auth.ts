import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/env";
import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "../errors";

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: "Authorization header is required", status: "error", code: "MISSING_TOKEN" },
      401,
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
    c.set("user", payload);
    await next();
    return;
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(
        { error: err.message, status: "error", code: err.code },
        err.statusCode as 401,
      );
    }
    throw err;
  }
};

export const optionalAuthMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
      c.set("user", payload);
    } catch {
      // token geçersizse sessizce devam et
    }
  }

  await next();
};

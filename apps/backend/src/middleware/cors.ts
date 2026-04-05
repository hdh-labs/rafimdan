import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/env";

export const corsMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const origin = c.env.CORS_ORIGIN || "*";

  const handler = cors({
    origin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86_400,
    credentials: true,
  });

  return handler(c, next);
};

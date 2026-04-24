import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "../types/env";
import { AppError } from "../errors";

export function handleError(c: Context<HonoEnv>, err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as StatusCode);
  }
  return c.json({ error: "Beklenmedik bir hata oluştu", status: "error", code: "INTERNAL_ERROR" }, 500);
}

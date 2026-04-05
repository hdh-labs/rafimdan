import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { HonoEnv } from "../types/env";
import { authMiddleware } from "../middleware/auth";
import { authService } from "../services/auth.service";
import { AppError } from "../errors";
import { updateProfileSchema } from "../schemas/auth.schemas";
import { REFRESH_TOKEN_MAX_AGE_SECONDS } from "../lib/jwt";

const auth = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setRefreshCookie(c: Context<HonoEnv>, token: string): void {
  setCookie(c, "refresh_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

function clearRefreshCookie(c: Context<HonoEnv>): void {
  deleteCookie(c, "refresh_token", { path: "/api/auth" });
}

function handleError(c: Context<HonoEnv>, err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 400);
  }
  throw err;
}

function getCallbackUrl(c: Context<HonoEnv>): string {
  const url = new URL(c.req.url);
  return `${url.origin}/api/auth/google/callback`;
}

// ---------------------------------------------------------------------------
// GET /google — OAuth başlat
// ---------------------------------------------------------------------------

auth.get("/google", async (c) => {
  const callbackUrl = getCallbackUrl(c);
  const { url } = await authService.buildGoogleAuthUrlWithState(c.env, callbackUrl);
  return c.redirect(url, 302);
});

// ---------------------------------------------------------------------------
// GET /google/callback — OAuth callback
// ---------------------------------------------------------------------------

auth.get("/google/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const state = c.req.query("state");

    if (!code || !state) {
      return c.json(
        { error: "Missing code or state", status: "error", code: "INVALID_CALLBACK" },
        400,
      );
    }

    const callbackUrl = getCallbackUrl(c);
    const result = await authService.handleGoogleCallback(
      c.env.DB,
      c.env,
      code,
      state,
      callbackUrl,
    );

    setRefreshCookie(c, result.refreshToken);

    const frontendUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
    return c.redirect(`${frontendUrl}/auth/callback`, 302);
  } catch (err) {
    if (err instanceof AppError) {
      const frontendUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
      return c.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message)}`,
        302,
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /logout
// ---------------------------------------------------------------------------

auth.post("/logout", async (c) => {
  try {
    const refreshToken = getCookie(c, "refresh_token");
    if (refreshToken) {
      await authService.logout(c.env.DB, refreshToken);
    }
    clearRefreshCookie(c);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST /refresh
// ---------------------------------------------------------------------------

auth.post("/refresh", async (c) => {
  try {
    const refreshToken = getCookie(c, "refresh_token");
    if (!refreshToken) {
      return c.json(
        { error: "Refresh token is required", status: "error", code: "MISSING_TOKEN" },
        401,
      );
    }

    const result = await authService.refreshAccessToken(c.env.DB, c.env, refreshToken);
    setRefreshCookie(c, result.refreshToken);

    return c.json({ data: { user: result.user, access_token: result.access_token }, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------------------

auth.get("/me", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const profile = await authService.getProfile(c.env.DB, sub);
    return c.json({ data: profile, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /me
// ---------------------------------------------------------------------------

auth.patch("/me", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  try {
    const { sub } = c.get("user");
    const body = c.req.valid("json");
    const profile = await authService.updateProfile(c.env.DB, sub, body);
    return c.json({ data: profile, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default auth;

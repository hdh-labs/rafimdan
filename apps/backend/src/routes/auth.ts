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
import { validateImageMagicBytes, getImageExtension } from "../lib/image-validation";
import { handleError } from "../lib/handle-error";

const auth = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCookieDomain(c: Context<HonoEnv>): string | undefined {
  const origin = c.env.CORS_ORIGIN;
  if (!origin) return undefined;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" ? undefined : `.${hostname}`;
  } catch {
    return undefined;
  }
}

function setRefreshCookie(c: Context<HonoEnv>, token: string): void {
  setCookie(c, "refresh_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    domain: getCookieDomain(c),
  });
}

function clearRefreshCookie(c: Context<HonoEnv>): void {
  deleteCookie(c, "refresh_token", { path: "/api/auth", domain: getCookieDomain(c) });
}


function getCallbackUrl(c: Context<HonoEnv>): string {
  const frontendUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
  return `${frontendUrl}/api/auth/google/callback`;
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
        { error: "Geçersiz kimlik doğrulama isteği", status: "error", code: "INVALID_CALLBACK" },
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
    const frontendUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
    const message = err instanceof AppError ? err.message : "Giriş yapılamadı, tekrar dene";
    return c.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`,
      302,
    );
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
        { error: "Oturum bulunamadı, tekrar giriş yapın", status: "error", code: "MISSING_TOKEN" },
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

// ---------------------------------------------------------------------------
// POST /me/avatar
// ---------------------------------------------------------------------------

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];

function isAllowedAvatarType(type: string): type is AllowedAvatarType {
  return (ALLOWED_AVATAR_TYPES as readonly string[]).includes(type);
}

auth.post("/me/avatar", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) throw new AppError("Dosya gerekli", 400, "MISSING_FILE");
    if (!isAllowedAvatarType(file.type)) {
      throw new AppError("Sadece JPEG, PNG veya WebP yüklenebilir", 400, "INVALID_FILE_TYPE");
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new AppError("Dosya 5 MB'dan büyük olamaz", 400, "FILE_TOO_LARGE");
    }

    if (!(await validateImageMagicBytes(file))) {
      throw new AppError("Sadece JPEG, PNG veya WebP yüklenebilir", 400, "INVALID_FILE_TYPE");
    }

    const ext = getImageExtension(file.type);
    const key = `avatars/${sub}.${ext}`;

    const existingProfile = await authService.getProfile(c.env.DB, sub);
    const oldUrl = existingProfile.avatar_url;

    await c.env.STORAGE.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    const baseUrl = c.env.STORAGE_PUBLIC_URL ?? "/api/storage";
    const fullUrl = `${baseUrl}/${key}?v=${Date.now()}`;

    if (oldUrl && oldUrl.startsWith(baseUrl)) {
      const oldKey = oldUrl.split("?")[0]!.slice(baseUrl.length + 1);
      if (oldKey !== key) {
        void c.env.STORAGE.delete(oldKey);
      }
    }

    const profile = await authService.updateAvatar(c.env.DB, sub, fullUrl);
    return c.json({ data: profile, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /me
// ---------------------------------------------------------------------------

auth.delete("/me", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    await authService.deleteAccount(c.env.DB, c.env, sub);
    clearRefreshCookie(c);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default auth;

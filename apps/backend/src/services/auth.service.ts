import type { AuthResult, UserProfile, UpdateProfileInput, User } from "@rafimdan/shared";
import type { Env } from "../types/env";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import { sha256 } from "../lib/crypto";
import { findUniqueSlug, generateSlug } from "../lib/slug";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signOAuthState,
  verifyOAuthState,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "../lib/jwt";
import {
  OAuthError,
  UserNotFoundError,
  AccountDisabledError,
  InvalidTokenError,
} from "../errors";

// ---------------------------------------------------------------------------
// Google OAuth helpers
// ---------------------------------------------------------------------------

type GoogleTokenResponse = {
  access_token: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
};

async function exchangeGoogleCode(
  env: Env,
  code: string,
  callbackUrl: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    code,
    redirect_uri: callbackUrl,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new OAuthError(`Token exchange failed: ${text}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new OAuthError("Failed to fetch Google user info");

  const data = (await res.json()) as Record<string, unknown>;

  return {
    id: data["id"] as string,
    email: data["email"] as string,
    name: (data["name"] as string | null) ?? (data["email"] as string).split("@")[0]!,
    picture: (data["picture"] as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

type TokenPair = { accessToken: string; refreshToken: string };

async function issueTokens(db: D1Database, user: User, secret: string): Promise<TokenPair> {
  const accessToken = await signAccessToken(
    { sub: user.id, email: "" },
    secret,
  );

  const jti = crypto.randomUUID();
  const refreshToken = await signRefreshToken({ sub: user.id, jti }, secret);

  const tokenHash = await sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000).toISOString();

  await refreshTokenRepository.create(db, {
    id: jti,
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

export const authService = {
  buildGoogleAuthUrl(env: Env, callbackUrl: string): string {
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async buildGoogleAuthUrlWithState(
    env: Env,
    callbackUrl: string,
  ): Promise<{ url: string; state: string }> {
    const nonce = crypto.randomUUID();
    const state = await signOAuthState(nonce, env.JWT_SECRET);
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent",
    });
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state,
    };
  },

  async handleGoogleCallback(
    db: D1Database,
    env: Env,
    code: string,
    state: string,
    callbackUrl: string,
  ): Promise<AuthResult & { refreshToken: string }> {
    await verifyOAuthState(state, env.JWT_SECRET);

    const tokenData = await exchangeGoogleCode(env, code, callbackUrl);
    const googleUser = await fetchGoogleUserInfo(tokenData.access_token);

    let user = await userRepository.findByGoogleId(db, googleUser.id);

    if (!user) {
      const slug = await findUniqueSlug(db, "users", generateSlug(googleUser.name));
      user = await userRepository.create(db, {
        id: crypto.randomUUID(),
        google_id: googleUser.id,
        name: googleUser.name,
        avatar_url: googleUser.picture,
      });
      await userRepository.update(db, user.id, { slug });
      user = (await userRepository.findById(db, user.id))!;
    } else if (!user.is_active) {
      throw new AccountDisabledError();
    }

    await userRepository.updateLastLogin(db, user.id);

    const { accessToken, refreshToken } = await issueTokens(db, user, env.JWT_SECRET);

    return {
      user: userRepository.toProfile(user),
      access_token: accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(
    db: D1Database,
    env: Env,
    refreshTokenRaw: string,
  ): Promise<AuthResult & { refreshToken: string }> {
    const payload = await verifyRefreshToken(refreshTokenRaw, env.JWT_SECRET);

    const tokenHash = await sha256(refreshTokenRaw);
    const stored = await refreshTokenRepository.findByTokenHash(db, tokenHash);
    if (!stored) throw new InvalidTokenError();

    await refreshTokenRepository.deleteByTokenHash(db, tokenHash);

    const user = await userRepository.findById(db, payload.sub);
    if (!user) throw new UserNotFoundError();
    if (!user.is_active) throw new AccountDisabledError();

    const { accessToken, refreshToken } = await issueTokens(db, user, env.JWT_SECRET);

    return {
      user: userRepository.toProfile(user),
      access_token: accessToken,
      refreshToken,
    };
  },

  async logout(db: D1Database, refreshTokenRaw: string): Promise<void> {
    const tokenHash = await sha256(refreshTokenRaw);
    await refreshTokenRepository.deleteByTokenHash(db, tokenHash);
  },

  async getProfile(db: D1Database, userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(db, userId);
    if (!user) throw new UserNotFoundError();
    return userRepository.toProfile(user);
  },

  async updateProfile(
    db: D1Database,
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    const user = await userRepository.update(db, userId, input);
    if (!user) throw new UserNotFoundError();
    return userRepository.toProfile(user);
  },
} as const;

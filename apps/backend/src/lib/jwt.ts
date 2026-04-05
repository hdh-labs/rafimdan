import { SignJWT, jwtVerify, errors } from "jose";
import type { AccessTokenPayload, RefreshTokenPayload } from "@rafimdan/shared";
import { TokenExpiredError, InvalidTokenError } from "../errors";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const OAUTH_STATE_EXPIRY = "5m";
const ISSUER = "rafimdan.com";

export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getKey(secret), { issuer: ISSUER });
    return {
      sub: payload.sub!,
      email: payload.email as string,
    };
  } catch (err) {
    if (err instanceof errors.JWTExpired) throw new TokenExpiredError();
    throw new InvalidTokenError();
  }
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyRefreshToken(
  token: string,
  secret: string,
): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getKey(secret), { issuer: ISSUER });
    return { sub: payload.sub!, jti: payload.jti! };
  } catch (err) {
    if (err instanceof errors.JWTExpired) throw new TokenExpiredError();
    throw new InvalidTokenError();
  }
}

export async function signOAuthState(nonce: string, secret: string): Promise<string> {
  return new SignJWT({ nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(OAUTH_STATE_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyOAuthState(state: string, secret: string): Promise<void> {
  try {
    await jwtVerify(state, getKey(secret), { issuer: ISSUER });
  } catch {
    throw new InvalidTokenError();
  }
}

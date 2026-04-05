import type { AccessTokenPayload } from "@rafimdan/shared";

export type Env = {
  DB: D1Database;
  STORAGE: R2Bucket;
  CORS_ORIGIN: string;
  STORAGE_PUBLIC_URL?: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user: AccessTokenPayload;
  };
};

import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import type { HonoEnv } from "./types/env";
import { corsMiddleware } from "./middleware/cors";
import { AppError } from "./errors";
import health from "./routes/health";
import auth from "./routes/auth";
import listings from "./routes/listings";
import categories from "./routes/categories";
import users from "./routes/users";
import favorites from "./routes/favorites";
import storage from "./routes/storage";

const app = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use("*", corsMiddleware);
app.use("*", logger());
app.use("*", prettyJSON());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.route("/api/health", health);
app.route("/api/auth", auth);
app.route("/api/listings", listings);
app.route("/api/categories", categories);
app.route("/api/users", users);
app.route("/api/favorites", favorites);
app.route("/api/storage", storage);

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

app.notFound((c) => {
  return c.json({ error: "Not Found", status: "error", code: "NOT_FOUND" }, 404);
});

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 500);
  }
  return c.json({ error: "Internal Server Error", status: "error", code: "INTERNAL_ERROR" }, 500);
});

export default app;

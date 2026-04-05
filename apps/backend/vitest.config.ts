import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          d1Databases: ["DB"],
          r2Buckets: ["STORAGE"],
          bindings: {
            JWT_SECRET: "test-secret-32-characters-long!!",
            GOOGLE_CLIENT_ID: "test-client-id",
            GOOGLE_CLIENT_SECRET: "test-client-secret",
            CORS_ORIGIN: "http://localhost:3000",
          },
        },
      },
    },
  },
});

import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { AppError } from "../errors";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { userRepository } from "../repositories/user.repository";
import { validateImageMagicBytes, getImageExtension } from "../lib/image-validation";

const feedback = new Hono<HonoEnv>();

const FEEDBACK_TYPES: Record<string, string> = {
  bug: "bug",
  ux: "UX",
  suggestion: "öneri",
  other: "diğer",
};

const GITHUB_LABELS: Record<string, string[]> = {
  bug: ["bug"],
  ux: ["ux"],
  suggestion: ["enhancement"],
  other: ["feedback"],
};

const OWNER = "hdh-labs";
const REPO = "rafimdan";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// ---------------------------------------------------------------------------
// POST /attachments — görsel yükle, R2'ye kaydet, public URL döndür
// ---------------------------------------------------------------------------

feedback.post("/attachments", optionalAuthMiddleware, async (c) => {
  const user = c.get("user");
  if (!user?.sub) {
    const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
    await checkAnonRateLimit(c.env.DB, ip);
  }

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    throw new AppError("Content-Type multipart/form-data olmalı", 400, "INVALID_CONTENT_TYPE");
  }

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) throw new AppError("Dosya gerekli", 400, "MISSING_FILE");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new AppError("Sadece görsel dosyaları kabul edilir", 400, "INVALID_FILE_TYPE");
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AppError("Dosya 5 MB'dan büyük olamaz", 400, "FILE_TOO_LARGE");
  }

  if (!(await validateImageMagicBytes(file))) {
    throw new AppError("Sadece görsel dosyaları kabul edilir", 400, "INVALID_FILE_TYPE");
  }

  const ext = getImageExtension(file.type);
  const key = `feedback/${crypto.randomUUID()}.${ext}`;

  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const baseUrl = c.env.STORAGE_PUBLIC_URL ?? "";
  const url = `${baseUrl}/${key}`;

  return c.json({ data: { url }, status: "ok" }, 201);
});

// ---------------------------------------------------------------------------
// Anonim kullanıcılar için IP tabanlı rate limit: saatte 5 feedback
// ---------------------------------------------------------------------------

const ANON_LIMIT = 5;
const WINDOW_MS  = 60 * 60 * 1000; // 1 saat

async function checkAnonRateLimit(db: D1Database, ip: string): Promise<void> {
  const now = Date.now();
  const row = await db
    .prepare("SELECT count, window_start FROM feedback_rate_limit WHERE ip = ?")
    .bind(ip)
    .first<{ count: number; window_start: string }>();

  if (!row || now - new Date(row.window_start).getTime() >= WINDOW_MS) {
    await db
      .prepare(
        "INSERT INTO feedback_rate_limit (ip, count, window_start) VALUES (?, 1, ?) " +
        "ON CONFLICT(ip) DO UPDATE SET count = 1, window_start = excluded.window_start",
      )
      .bind(ip, new Date(now).toISOString())
      .run();
    return;
  }

  if (row.count >= ANON_LIMIT) {
    throw new AppError("Çok fazla geri bildirim gönderdiniz. Bir saat sonra tekrar deneyin.", 429, "RATE_LIMIT");
  }

  await db
    .prepare("UPDATE feedback_rate_limit SET count = count + 1 WHERE ip = ?")
    .bind(ip)
    .run();
}

// ---------------------------------------------------------------------------
// POST / — feedback gönder, GitHub issue aç
// ---------------------------------------------------------------------------

feedback.post("/", optionalAuthMiddleware, async (c) => {
  const body = await c.req.json<{
    type?: string;
    description?: string;
    page_url?: string;
    attachment_urls?: string[];
  }>();

  const type = body.type ?? "other";
  const description = body.description?.trim();

  if (!description || description.length < 5) {
    throw new AppError("Açıklama en az 5 karakter olmalı", 400, "VALIDATION_ERROR");
  }
  if (description.length > 2000) {
    throw new AppError("Açıklama en fazla 2000 karakter olabilir", 400, "VALIDATION_ERROR");
  }
  if (!(type in FEEDBACK_TYPES)) {
    throw new AppError("Geçersiz tür", 400, "VALIDATION_ERROR");
  }

  const user = c.get("user");
  if (!user?.sub) {
    const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
    await checkAnonRateLimit(c.env.DB, ip);
  }

  const dbUser = user?.sub ? await userRepository.findById(c.env.DB, user.sub) : null;
  const userAgent = c.req.header("user-agent") ?? "bilinmiyor";

  const senderLines = user?.sub
    ? [
        `**Ad:** ${dbUser?.name ?? "—"}`,
        `**E-posta:** ${user.email ?? "—"}`,
        `**ID:** \`${user.sub}\``,
      ].join("\n")
    : "**Gönderen:** Anonim";

  const typeLabel = FEEDBACK_TYPES[type] ?? type;

  const storageBase = (c.env.STORAGE_PUBLIC_URL ?? "").replace(/\/$/, "");
  const safeAttachments = (body.attachment_urls ?? [])
    .slice(0, 3)
    .filter(url => {
      if (storageBase) return url.startsWith(storageBase + "/");
      return /^\/api\/storage\//.test(url);
    });
  const attachmentsMd = safeAttachments.map((url, i) => `![Ekran görüntüsü ${i + 1}](${url})`).join("\n");

  let safePageUrl: string | null = null;
  if (body.page_url) {
    try {
      const parsed = new URL(body.page_url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        safePageUrl = parsed.toString();
      }
    } catch { /* geçersiz URL — yoksay */ }
  }

  const issueBody = [
    `## ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Bildirimi`,
    "",
    description,
    attachmentsMd ? `\n${attachmentsMd}` : "",
    "---",
    "### Gönderen",
    senderLines,
    "### Bağlam",
    safePageUrl ? `**Sayfa:** ${safePageUrl}` : "",
    `**Tarih:** ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
    `**Tarayıcı:** \`${userAgent}\``,
  ]
    .filter(Boolean)
    .join("\n");

  const issueTitle =
    description.length > 60
      ? `[${typeLabel}] ${description.slice(0, 60)}…`
      : `[${typeLabel}] ${description}`;

  const ghHeaders = {
    Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "rafimdan-feedback-bot",
  };

  const labels = GITHUB_LABELS[type] ?? ["feedback"];
  let res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
    method: "POST",
    headers: ghHeaders,
    body: JSON.stringify({ title: issueTitle, body: issueBody, labels }),
  });

  // Label'lar repoda yoksa 422 döner — label'sız tekrar dene
  if (res.status === 422) {
    res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify({ title: issueTitle, body: issueBody }),
    });
  }

  if (!res.ok) {
    const ghError = await res.json<{ message?: string }>().catch(() => ({} as { message?: string }));
    throw new AppError(
      `GitHub ${res.status}: ${ghError.message ?? "bilinmeyen hata"}`,
      502,
      "GITHUB_ERROR",
    );
  }

  const issue = await res.json<{ number: number; html_url: string }>();
  return c.json({ data: { issue_number: issue.number }, status: "ok" }, 201);
});

export default feedback;

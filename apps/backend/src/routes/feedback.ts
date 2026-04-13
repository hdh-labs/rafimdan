import { Hono } from "hono";
import type { HonoEnv } from "../types/env";
import { AppError } from "../errors";
import { authMiddleware } from "../middleware/auth";

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

feedback.post("/attachments", authMiddleware, async (c) => {
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

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `feedback/${crypto.randomUUID()}.${ext}`;

  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const baseUrl = c.env.STORAGE_PUBLIC_URL ?? "";
  const url = `${baseUrl}/${key}`;

  return c.json({ data: { url }, status: "ok" }, 201);
});

// ---------------------------------------------------------------------------
// POST / — feedback gönder, GitHub issue aç
// ---------------------------------------------------------------------------

feedback.post("/", authMiddleware, async (c) => {
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
  const senderInfo = user?.sub ? `Kullanıcı ID: \`${user.sub}\`` : "Anonim";

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
    safePageUrl ? `**Sayfa:** ${safePageUrl}` : "",
    `**Gönderen:** ${senderInfo}`,
    `**Tarih:** ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
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
    const ghError = await res.json<{ message?: string }>().catch(() => ({}));
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

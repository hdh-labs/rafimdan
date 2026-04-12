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

feedback.post("/attachments", async (c) => {
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

feedback.post("/", async (c) => {
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

  // Login olmuşsa kullanıcı bilgisini al
  let senderInfo = "Anonim";
  try {
    await authMiddleware(c, async () => {});
    const user = c.get("user");
    if (user?.sub) senderInfo = `Kullanıcı ID: \`${user.sub}\``;
  } catch {
    // anonim — devam
  }

  const typeLabel = FEEDBACK_TYPES[type] ?? type;
  const attachments = (body.attachment_urls ?? []).slice(0, 3);
  const attachmentsMd = attachments.map((url, i) => `![Ekran görüntüsü ${i + 1}](${url})`).join("\n");

  const issueBody = [
    `## ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Bildirimi`,
    "",
    description,
    attachmentsMd ? `\n${attachmentsMd}` : "",
    "---",
    body.page_url ? `**Sayfa:** ${body.page_url}` : "",
    `**Gönderen:** ${senderInfo}`,
    `**Tarih:** ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  const issueTitle =
    description.length > 60
      ? `[${typeLabel}] ${description.slice(0, 60)}…`
      : `[${typeLabel}] ${description}`;

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "rafimdan-feedback-bot",
    },
    body: JSON.stringify({
      title: issueTitle,
      body: issueBody,
      labels: GITHUB_LABELS[type] ?? ["feedback"],
    }),
  });

  if (!res.ok) {
    throw new AppError("Geri bildirim gönderilemedi", 502, "GITHUB_ERROR");
  }

  const issue = await res.json<{ number: number; html_url: string }>();
  return c.json({ data: { issue_number: issue.number }, status: "ok" }, 201);
});

export default feedback;

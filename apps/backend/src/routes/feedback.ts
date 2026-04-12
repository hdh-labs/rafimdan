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

feedback.post("/", async (c) => {
  const body = await c.req.json<{
    type?: string;
    description?: string;
    page_url?: string;
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

  // Opsiyonel: login olmuşsa kullanıcı bilgisini al
  let senderInfo = "Anonim";
  try {
    await authMiddleware(c, async () => {});
    const user = c.get("user");
    if (user?.sub) senderInfo = `Kullanıcı ID: \`${user.sub}\``;
  } catch {
    // login değil — anonim bırak
  }

  const typeLabel = FEEDBACK_TYPES[type] ?? type;
  const pageInfo = body.page_url ? `**Sayfa:** ${body.page_url}` : "";

  const issueBody = [
    `## ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Bildirimi`,
    "",
    description,
    "",
    "---",
    pageInfo,
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

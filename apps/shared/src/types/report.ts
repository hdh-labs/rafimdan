export type ReportStatus = "open" | "resolved" | "dismissed";

export type Report = {
  id: string;
  listing_id: string;
  listing_slug: string;
  listing_title: string;
  reporter_name: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
};

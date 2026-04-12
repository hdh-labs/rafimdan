export type AdminLogAction =
  | "listing_approve"
  | "listing_reject"
  | "listing_deactivate"
  | "listing_delete"
  | "user_ban"
  | "user_unban"
  | "user_promote"
  | "user_demote";

export type AdminLog = {
  id: string;
  admin_id: string;
  admin_name: string;
  action: AdminLogAction;
  target_type: "listing" | "user";
  target_id: string;
  meta: string | null;
  created_at: string;
};

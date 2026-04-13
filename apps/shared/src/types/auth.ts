export type OAuthProvider = "google";

export const OAUTH_PROVIDERS = ["google"] as const;

export type User = {
  id: string;
  google_id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  slug: string | null;
  is_active: number;
  is_admin: number;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  slug: string | null;
  is_active: number;
  is_admin: number;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  slug: string;
  created_at: string;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

export type AuthResult = {
  user: UserProfile;
  access_token: string;
};

export type UpdateProfileInput = {
  display_name?: string;
  whatsapp?: string;
  city?: string;
  district?: string;
  bio?: string;
};

export type CreateUserInput = {
  id: string;
  google_id: string;
  name: string;
  slug: string;
  avatar_url?: string | null;
};

export type CreateRefreshTokenInput = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
};

export type AdminUserProfile = UserProfile & {
  listing_count: number;
};

export type AdminStats = {
  total_users: number;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  pending_listings: number;
  rejected_listings: number;
  total_reports: number;
};

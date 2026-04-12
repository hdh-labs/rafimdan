export type ListingCondition = "new" | "like_new" | "good" | "fair";
export type ListingPriceType = "fixed" | "negotiable" | "free";
export type ListingStatus = "active" | "sold" | "pending" | "rejected";
export type ListingDirection = "offer" | "request";

export const LISTING_CONDITIONS = ["new", "like_new", "good", "fair"] as const;
export const LISTING_PRICE_TYPES = ["fixed", "negotiable", "free"] as const;
export const LISTING_STATUSES = ["active", "sold", "pending", "rejected"] as const;
export const LISTING_DIRECTIONS = ["offer", "request"] as const;

export type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string;
  condition: ListingCondition;
  price_type: ListingPriceType;
  price: number | null;
  city: string;
  district: string | null;
  photos: string;
  status: ListingStatus;
  direction: ListingDirection;
  rejection_reason: string | null;
  slug: string;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type ListingListItem = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  price_type: ListingPriceType;
  condition: ListingCondition;
  status: ListingStatus;
  direction: ListingDirection;
  rejection_reason: string | null;
  cover_photo: string | null;
  city: string;
  district: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    name: string;
    display_name: string | null;
    slug: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
  view_count: number;
  favorites_count: number;
};

export type ListingDetail = Omit<ListingListItem, "cover_photo" | "seller" | "direction"> & {
  direction: ListingDirection;
  description: string | null;
  photos: string[];
  seller: {
    id: string;
    name: string;
    display_name: string | null;
    slug: string | null;
    avatar_url: string | null;
    whatsapp: string | null;
    city: string | null;
    created_at: string;
  };
};

export type CreateListingInput = {
  title: string;
  description?: string;
  category_id: string;
  condition: ListingCondition;
  price_type: ListingPriceType;
  price?: number;
  city: string;
  district?: string;
  direction?: ListingDirection;
};

export type UpdateListingInput = Partial<CreateListingInput>;

export type UpdateListingStatusInput = {
  status: ListingStatus;
};

export type ListingsQueryParams = {
  city?: string;
  district?: string;
  category?: string;
  price_type?: ListingPriceType;
  condition?: ListingCondition;
  direction?: ListingDirection;
  sort?: "recent" | "popular";
  q?: string;
  page?: number;
  limit?: number;
};

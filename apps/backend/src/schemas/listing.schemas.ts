import { z } from "zod";
import { LISTING_CONDITIONS, LISTING_PRICE_TYPES, LISTING_STATUSES, LISTING_DIRECTIONS, LISTING_TYPES } from "@rafimdan/shared";

export const createListingSchema = z
  .object({
    listing_type: z.enum(LISTING_TYPES).default("item"),
    title: z.string().min(3).max(100),
    description: z.string().max(2000).optional(),
    category_id: z.string().min(1),
    condition: z.enum(LISTING_CONDITIONS).optional(),
    price_type: z.enum(LISTING_PRICE_TYPES),
    price: z.number().int().positive().optional(),
    city: z.string().min(2).max(60),
    district: z.string().min(2).max(60).optional(),
    direction: z.enum(LISTING_DIRECTIONS).default("offer"),
    temp_photo_keys: z.array(z.string().max(300)).max(6).optional(),
  })
  .refine(
    (data) => {
      if (data.listing_type === "item" && data.direction === "offer") {
        return data.condition !== undefined;
      }
      return true;
    },
    { message: "Ürün durumu zorunlu", path: ["condition"] },
  )
  .refine(
    (data) =>
      data.direction === "request" ||
      data.price_type === "free" ||
      data.price !== undefined,
    { message: "Fiyat zorunlu", path: ["price"] },
  );

export const updateListingSchema = z.object({
  listing_type: z.enum(LISTING_TYPES).optional(),
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  category_id: z.string().min(1).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  price_type: z.enum(LISTING_PRICE_TYPES).optional(),
  price: z.number().int().positive().nullable().optional(),
  city: z.string().min(2).max(60).optional(),
  district: z.string().min(2).max(60).optional(),
  direction: z.enum(LISTING_DIRECTIONS).optional(),
});

export const listingStatusSchema = z.object({
  status: z.enum(["active", "sold"] as const),
});

export const adminModerateSchema = z.object({
  status: z.enum(["active", "rejected"] as const),
  reason: z.string().max(500).optional(),
});

export const listingsQuerySchema = z.object({
  listing_type: z.enum(LISTING_TYPES).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  category: z.string().optional().transform((v) => v?.trim() || undefined),
  price_type: z.enum(LISTING_PRICE_TYPES).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  direction: z.string().optional().transform((v, ctx) => {
    if (!v) return undefined;
    const values = v.split(",");
    for (const val of values) {
      if (!(LISTING_DIRECTIONS as readonly string[]).includes(val)) {
        ctx.addIssue({ code: "custom", message: `Geçersiz direction: ${val}` });
        return z.NEVER;
      }
    }
    const dirs = values as import("@rafimdan/shared").ListingDirection[];
    return dirs.length > 1 ? dirs : dirs[0];
  }),
  sort: z.enum(["recent", "popular"]).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

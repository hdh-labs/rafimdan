import { z } from "zod";
import { LISTING_CONDITIONS, LISTING_PRICE_TYPES, LISTING_STATUSES } from "@rafimdan/shared";

export const createListingSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().max(2000).optional(),
    category_id: z.string().min(1),
    condition: z.enum(LISTING_CONDITIONS),
    price_type: z.enum(LISTING_PRICE_TYPES),
    price: z.number().int().positive().optional(),
    city: z.string().min(2).max(60),
    district: z.string().min(2).max(60).optional(),
  })
  .refine(
    (data) => data.price_type === "free" || data.price !== undefined,
    { message: "Fiyat zorunlu", path: ["price"] },
  );

export const updateListingSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  category_id: z.string().min(1).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  price_type: z.enum(LISTING_PRICE_TYPES).optional(),
  price: z.number().int().positive().optional(),
  city: z.string().min(2).max(60).optional(),
  district: z.string().min(2).max(60).optional(),
});

export const listingStatusSchema = z.object({
  status: z.enum(LISTING_STATUSES),
});

export const listingsQuerySchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  category: z.string().optional(),
  price_type: z.enum(LISTING_PRICE_TYPES).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

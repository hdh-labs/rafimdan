import { z } from "zod";

export const favoriteAddSchema = z.object({
  listing_id: z.string().min(1),
});

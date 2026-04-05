import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Geçerli bir telefon numarası girin")
    .optional(),
  city: z.string().min(2).max(60).optional(),
  district: z.string().min(2).max(60).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

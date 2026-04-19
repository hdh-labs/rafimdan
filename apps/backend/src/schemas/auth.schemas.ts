import { z } from "zod";
import { VALID_DISTRICTS } from "@rafimdan/shared";

export const updateProfileSchema = z.object({
  display_name: z.string().max(60).nullable().optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Geçerli bir telefon numarası girin")
    .nullable()
    .optional(),
  city: z.string().min(2).max(60).nullable().optional(),
  district: z.string().min(2).max(60)
    .refine((val) => VALID_DISTRICTS.has(val), { message: "Geçersiz ilçe" })
    .nullable().optional(),
  bio: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

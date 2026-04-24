import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().max(60).nullable().optional(),
  whatsapp: z
    .string()
    .transform((v) => {
      const digits = v.replace(/\D/g, "");
      if (digits.startsWith("90") && digits.length === 12) return digits;
      if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
      if (digits.length === 10) return "90" + digits;
      return digits;
    })
    .pipe(z.string().regex(/^90[0-9]{10}$/, "Geçerli bir telefon numarası girin"))
    .nullable()
    .optional(),
  city: z.string().min(2).max(60).nullable().optional(),
  district: z.string().min(2).max(60).nullable().optional(),
  bio: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

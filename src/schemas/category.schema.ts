import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede superar 60 caracteres'),
  slug: z.string().optional(),
  description: z
    .string()
    .max(240, 'La descripción no puede superar 240 caracteres')
    .optional()
    .default(''),
  imageUrl: z.string().optional().default(''),
  imagePath: z.string().optional().default(''),
  order: z.coerce.number().int().min(1, 'El orden mínimo es 1').default(1),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;


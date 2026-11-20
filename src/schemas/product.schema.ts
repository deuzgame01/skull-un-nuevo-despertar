import { z } from 'zod';

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'El nombre del producto debe tener al menos 3 caracteres')
      .max(120, 'Máximo 120 caracteres'),
    slug: z
      .string()
      .trim()
      .max(140, 'Máximo 140 caracteres')
      .optional()
      .default(''),
    sku: z
      .string()
      .trim()
      .max(30, 'Máximo 30 caracteres')
      .optional()
      .default(''),
    shortDescription: z
      .string()
      .trim()
      .min(5, 'Agrega un resumen corto para el catálogo y WhatsApp')
      .max(180, 'Máximo 180 caracteres'),
    description: z
      .string()
      .trim()
      .min(10, 'Agrega una descripción detallada del producto')
      .max(3000, 'Máximo 3000 caracteres'),
    price: z.coerce
      .number({ invalid_type_error: 'Ingresa un precio numérico válido en COP' })
      .finite('El precio debe ser un número válido')
      .positive('El precio debe ser mayor a $0 COP')
      .min(100, 'El precio mínimo permitido es $100 COP'),
    compareAtPrice: z
      .union([z.coerce.number().min(0), z.literal(''), z.null()])
      .optional()
      .transform((val) =>
        val === '' || val === null || val === undefined || Number(val) <= 0
          ? null
          : Number(val)
      ),
    currency: z.string().default('COP'),
    categoryId: z.string().min(1, 'Selecciona una categoría obligatoria'),
    material: z
      .string()
      .trim()
      .min(2, 'Indica el material (ej. Titanio ASTM F-136)')
      .default('Titanio Grado Implante (ASTM F-136)'),
    bodyZone: z.array(z.string()).default([]),
    gauge: z.string().optional().default('16G (1.2mm)'),
    sizes: z.array(z.string()).default([]),
    color: z.string().optional().default('Plata / Natural'),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    stockStatus: z
      .enum(['in_stock', 'low_stock', 'out_of_stock', 'on_request'])
      .default('in_stock'),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice !== null && data.compareAtPrice !== undefined) {
        return data.compareAtPrice > data.price;
      }
      return true;
    },
    {
      message: 'El precio anterior debe ser mayor que el precio actual',
      path: ['compareAtPrice'],
    }
  );

export type ProductFormValues = z.infer<typeof productSchema>;

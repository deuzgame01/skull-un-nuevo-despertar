import { z } from 'zod';

export const brandSettingsSchema = z.object({
  siteName: z.string().min(2, 'El nombre de la marca es obligatorio'),
  tagline: z.string().min(2, 'El lema es obligatorio'),
  description: z.string().min(10, 'La descripción SEO es obligatoria'),
  logoUrl: z.string().default('/images/logo-skull.png'),
  heroBannerUrl: z.string().optional().default(''),
  heroBadge: z.string().default('ESTUDIO & JOYERÍA CORPORAL'),
  heroTitle: z.string().min(3, 'El título principal es obligatorio'),
  heroSubtitle: z.string().min(5, 'El subtítulo es obligatorio'),
  announcementBar: z.string().optional().default(''),
  instagramHandle: z.string().default('@skull.unnuevodespertar'),
  instagramUrl: z.string().url('Ingresa una URL válida de Instagram').or(z.literal('')),
  tiktokUrl: z.string().optional().default(''),
  locationText: z.string().default('Atención con cita previa • Envíos nacionales'),
  currency: z.enum(['COP', 'MXN', 'USD', 'PEN', 'ARS', 'CLP', 'EUR']).default('COP'),
});

export const whatsappSettingsSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, 'Ingresa el número con código de país (ej. 573001234567)'),
  ownerName: z.string().default('SKULL Studio'),
  generalGreeting: z.string().min(5, 'Ingresa un mensaje de saludo general'),
  productMessageTemplate: z
    .string()
    .min(10, 'Ingresa la plantilla de mensaje para productos'),
  showFloatingButton: z.boolean().default(true),
  floatingButtonLabel: z.string().default('Asesoría / Citas'),
  businessHoursNote: z.string().default('Lun a Sáb • 10:00 AM – 8:00 PM'),
});

export type BrandSettingsFormValues = z.infer<typeof brandSettingsSchema>;
export type WhatsAppSettingsFormValues = z.infer<typeof whatsappSettingsSchema>;


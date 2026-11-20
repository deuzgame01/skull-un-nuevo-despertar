import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utilidad estándar de shadcn para combinar clases condicionales. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Allowlist de correos con permisos de administración.
 *
 * Se puede sobrescribir desde el entorno con `NEXT_PUBLIC_ADMIN_EMAILS`
 * (separado por comas). El valor por defecto se conserva para no romper
 * despliegues que aún no definen la variable.
 */

const DEFAULT_ADMIN_EMAILS =
  'deuzgame01@gmail.com,admin@skullpiercing.com';

export function getAdminEmails(): string[] {
  const rawList = process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS;

  return rawList
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/** Correo principal, usado como valor inicial en el formulario de acceso. */
export function getPrimaryAdminEmail(): string {
  return getAdminEmails()[0] || '';
}

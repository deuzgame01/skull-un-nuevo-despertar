export const ANNOUNCEMENT_MAX_MESSAGES = 5;
export const ANNOUNCEMENT_MAX_LENGTH = 60;

/** Normaliza los mensajes del cintillo: máximo 5 y sin exceder el límite de caracteres. */
export function normalizeAnnouncementMessages(
  messages: string[] | undefined
): string[] {
  if (!messages) return [];

  return messages
    .map((message) =>
      Array.from(message.trim())
        .slice(0, ANNOUNCEMENT_MAX_LENGTH)
        .join('')
    )
    .filter(Boolean)
    .slice(0, ANNOUNCEMENT_MAX_MESSAGES);
}

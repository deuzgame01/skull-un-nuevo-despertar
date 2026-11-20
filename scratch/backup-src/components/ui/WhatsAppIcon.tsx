import React from 'react';

interface WhatsAppIconProps {
  className?: string;
}

/**
 * SVG vectorial oficial del logo de WhatsApp (burbuja verde #25D366 con auricular blanco),
 * idéntico a la referencia proporcionada para todos los botones de acción a WhatsApp.
 */
export function WhatsAppIcon({ className = 'w-5 h-5' }: WhatsAppIconProps) {
  return (
    <svg
      viewBox="0 0 175.216 175.552"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fill="#25D366"
        d="M87.4 14.2C47.1 14.2 14.3 46.9 14.3 87.3c0 13.8 3.8 26.8 10.5 37.9L14 161.3l37.2-10.4c10.7 5.9 23 9.3 36.2 9.3 40.3 0 73.1-32.7 73.1-73.1 0-40.3-32.8-72.9-73.1-72.9z"
      />
      <path
        fill="#FFFFFF"
        d="M125.6 105.7c-1.8-.9-10.7-5.3-12.3-5.9-1.7-.6-2.9-.9-4.1.9-1.2 1.8-4.7 5.9-5.7 7.1-1.1 1.2-2.1 1.3-3.9.4-1.8-.9-7.6-2.8-14.5-8.9-5.4-4.8-9-10.7-10-12.5-1.1-1.8-.1-2.8.8-3.7.8-.8 1.8-2.1 2.7-3.1.9-1.1 1.2-1.8 1.8-3 .6-1.2.3-2.2-.1-3.1-.5-.9-4.1-9.8-5.6-13.5-1.5-3.6-3-3.1-4.1-3.1-1.1-.1-2.3-.1-3.5-.1s-3.1.4-4.8 2.2c-1.7 1.8-6.3 6.2-6.3 15.1s6.5 17.5 7.4 18.7c.9 1.2 12.7 19.4 30.8 27.2 4.3 1.9 7.7 3 10.3 3.8 4.3 1.4 8.2 1.2 11.3.7 3.5-.5 10.7-4.4 12.2-8.6 1.5-4.2 1.5-7.8 1.1-8.6-.5-.7-1.7-1.2-3.5-2.1z"
      />
    </svg>
  );
}


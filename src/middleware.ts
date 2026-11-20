import { NextResponse, type NextRequest } from 'next/server';
import { getAdminEmails } from '@/lib/admin-emails';

const ADMIN_SESSION_COOKIE = 'skull_admin_session';

function isAuthorizedEmail(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return getAdminEmails().includes(cleanEmail);
}

interface ParsedSession {
  valid: boolean;
  expired: boolean;
  uid?: string;
  email?: string;
}

function parseSessionCookie(rawValue?: string): ParsedSession {
  if (!rawValue) {
    return { valid: false, expired: false };
  }

  try {
    const decodedJson = atob(decodeURIComponent(rawValue));
    const data = JSON.parse(decodedJson) as {
      uid?: string;
      email?: string;
      exp?: number;
    };

    if (!data.uid || !data.email || !isAuthorizedEmail(data.email)) {
      return { valid: false, expired: false };
    }

    if (typeof data.exp !== 'number' || Date.now() >= data.exp) {
      return { valid: false, expired: true, uid: data.uid, email: data.email };
    }

    return {
      valid: true,
      expired: false,
      uid: data.uid,
      email: data.email,
    };
  } catch {
    return { valid: false, expired: false };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === '/admin/login';
  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseSessionCookie(cookieValue);

  // Si ya tiene sesión válida e intenta entrar a /admin/login, redirigir al Dashboard
  if (isLoginRoute) {
    if (session.valid) {
      const dashboardUrl = new URL('/admin', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Rutas administrativas protegidas (/admin, /admin/productos, /admin/categorias, etc.)
  if (!session.valid) {
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    if (session.expired) {
      loginUrl.searchParams.set('expired', '1');
    }

    const response = NextResponse.redirect(loginUrl);
    if (cookieValue) {
      response.cookies.delete(ADMIN_SESSION_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};


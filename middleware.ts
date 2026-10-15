import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.svg|AndiNu_icon.png|icons|poses|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * Vercel Edge Middleware / Server Request Interceptor
 * Ensures auth session tokens are refreshed and persisted with 1-year durable cookies
 */
export async function middleware(request: Request) {
  const url = new URL(request.url);
  
  // Skip static assets
  if (
    url.pathname.startsWith('/assets') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/poses') ||
    url.pathname.includes('.')
  ) {
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const responseHeaders = new Headers();
  responseHeaders.set('x-middleware-next', '1');

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieHeader
          .split(';')
          .map((c) => {
            const [name, ...val] = c.trim().split('=');
            return { name: name?.trim(), value: val.join('=')?.trim() };
          })
          .filter((c) => c.name && c.value);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOpts = {
            path: '/',
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, // 1 year durable session
            ...options,
          };
          let cookieStr = `${name}=${encodeURIComponent(value)}; Path=${cookieOpts.path}; Max-Age=${cookieOpts.maxAge}; SameSite=${cookieOpts.sameSite}`;
          if (cookieOpts.secure) cookieStr += '; Secure';
          responseHeaders.append('Set-Cookie', cookieStr);
        });
      },
    },
  });

  // Calling getUser() validates session and automatically triggers setAll() to refresh tokens
  try {
    await supabase.auth.getUser();
  } catch (err) {
    console.warn('Middleware auth token check error:', err);
  }

  return new Response(null, {
    headers: responseHeaders,
  });
}


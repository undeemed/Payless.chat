import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      "https://bycsqbjaergjhwzbulaa.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3NxYmphZXJnamh3emJ1bGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDYyODksImV4cCI6MjA4MDAyMjI4OX0.QOwTw7YhqvZRr-ceaR0vAu3jQUQWtjkucu17LJPexMg",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error('Auth callback error:', error);
  }

  // Return to home on error
  return NextResponse.redirect(`${origin}/?error=auth`);
}

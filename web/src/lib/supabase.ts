import { createBrowserClient } from '@supabase/ssr';

// Supabase project config (anon key is safe for client-side use)
export const supabaseUrl = "https://bycsqbjaergjhwzbulaa.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3NxYmphZXJnamh3emJ1bGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDYyODksImV4cCI6MjA4MDAyMjI4OX0.QOwTw7YhqvZRr-ceaR0vAu3jQUQWtjkucu17LJPexMg";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

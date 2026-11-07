// Public values from .env: Vercel functions don't read .env, and Vite only inlines it into the app.
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://basihmnebvsflzkaivds.supabase.co";
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U";
export const BUSINESS_NAME = process.env.VITE_BUSINESS_NAME || "VARIETY HEAVEN";

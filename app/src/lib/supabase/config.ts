// These are meant to be public: the URL and publishable/anon key are exposed
// to the browser bundle regardless, and every table is protected by row
// level security rather than by keeping this pair secret. The fallback lets
// the app run on hosts where NEXT_PUBLIC_* env vars weren't configured.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wcjymaohtnmhzzehqxfp.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_HJSrQsOxjpW-O-nazfCuBQ_4Jp8vviI";

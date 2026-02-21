// CORS helper for Supabase Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for now (can restrict to https://frontend-sandy-three-35.vercel.app)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

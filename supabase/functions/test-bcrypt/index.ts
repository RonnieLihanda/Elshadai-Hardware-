import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const hash = await bcrypt.hash("test123", 10);
    const isValid = await bcrypt.compare("test123", hash);

    return new Response(
      JSON.stringify({ message: "Bcrypt test works!", hash, isValid }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

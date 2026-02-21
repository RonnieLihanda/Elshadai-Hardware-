import { handleCors } from "../_shared/cors.ts";
import { createToken } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Test JWT creation only
    const token = await createToken({
      id: 1,
      username: "test",
      role: "admin",
      fullName: "Test User"
    });

    return new Response(
      JSON.stringify({ message: "Auth test works!", token }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

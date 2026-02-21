import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { successResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Authenticate request
  const user = await authenticateRequest(req);
  if (user instanceof Response) return user;

  return successResponse(user);
});

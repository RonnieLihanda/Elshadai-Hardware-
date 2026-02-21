import { handleCors } from "../_shared/cors.ts";
import { query } from "../_shared/database.ts";
import { successResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Check all users
    const { rows } = await query('SELECT id, username, full_name, role, is_active FROM users ORDER BY id');

    return successResponse({
      message: "Database connection working!",
      userCount: rows.length,
      users: rows
    });
  } catch (err) {
    return successResponse({
      error: err.message,
      stack: err.stack
    });
  }
});

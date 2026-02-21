import bcrypt from "npm:bcryptjs@2.4.3";
import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, UserPayload } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

async function handleList(user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { rows } = await query(`SELECT id, username, full_name, role, is_active, created_at FROM users`);
  return successResponse(rows);
}

async function handleChangePassword(req: Request, user: UserPayload, userId: string) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { new_password } = await req.json();

  if (!new_password || new_password.length < 6) {
    return errorResponse('Password must be at least 6 characters long', 400);
  }

  const password_hash = bcrypt.hashSync(new_password, 10);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [password_hash, userId]);

  return successResponse({ message: 'Password updated successfully' });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await authenticateRequest(req);
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const userId = pathParts[pathParts.length - 2]; // e.g., /users/123/password
    const action = pathParts[pathParts.length - 1];

    if (req.method === 'GET') {
      return await handleList(user);
    } else if (req.method === 'PUT' && action === 'password') {
      return await handleChangePassword(req, user, userId);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message);
  }
});

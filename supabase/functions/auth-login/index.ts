import bcrypt from "npm:bcryptjs@2.4.3";
import { handleCors } from "../_shared/cors.ts";
import { createToken } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  full_name: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return errorResponse('Username and password required', 400);
    }

    // Get user from database
    const { rows } = await query<User>(
      `SELECT * FROM users WHERE username = $1 AND is_active = TRUE`,
      [username]
    );

    const user = rows[0];

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return errorResponse('Invalid credentials', 401);
    }

    // Create JWT token
    const token = await createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(err.message);
  }
});

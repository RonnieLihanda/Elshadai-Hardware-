import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, UserPayload } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

async function handleLookup(url: URL) {
  const phone = url.searchParams.get('phone');
  if (!phone) return errorResponse('Phone number required', 400);

  let cleanPhone = phone.replace(/\s+/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

  const { rows } = await query('SELECT * FROM customers WHERE phone_number = $1', [cleanPhone]);
  const customer = rows[0];
  if (!customer) return errorResponse('Customer not found', 404);

  return successResponse(customer);
}

async function handleList(url: URL, user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const minPurchases = url.searchParams.get('minPurchases');
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params: number[] = [];

  if (minPurchases) {
    sql += ' AND mpesa_purchases_count >= $1';
    params.push(parseInt(minPurchases));
  }

  sql += ' ORDER BY total_spent DESC';

  const { rows } = await query(sql, params);
  return successResponse(rows);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await authenticateRequest(req);
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);

    if (url.pathname.includes('/lookup')) {
      return await handleLookup(url);
    } else {
      return await handleList(url, user);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
});

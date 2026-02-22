import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, UserPayload } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

async function handleGetAuditLogs(url: URL, user: UserPayload) {
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const itemCode = url.searchParams.get('itemCode');
  const type = url.searchParams.get('type');

  let sql = `
    SELECT
      ia.*,
      u.full_name as user_name
    FROM inventory_audit ia
    LEFT JOIN users u ON ia.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (itemCode) {
    params.push(itemCode);
    sql += ` AND ia.item_code ILIKE $${params.length}`;
  }

  if (type && type !== 'all') {
    params.push(type);
    sql += ` AND ia.change_type = $${params.length}`;
  }

  params.push(limit);
  sql += ` ORDER BY ia.created_at DESC LIMIT $${params.length}`;

  const { rows } = await query(sql, params);
  return successResponse(rows);
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Authenticate request
  const user = await authenticateRequest(req);
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);

    if (req.method === 'GET') {
      return await handleGetAuditLogs(url, user);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('Audit logs error:', err);
    return errorResponse(err.message);
  }
});

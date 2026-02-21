import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, UserPayload } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

async function handleList(user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { rows } = await query(`SELECT * FROM receipts ORDER BY created_at DESC`);
  return successResponse(rows);
}

async function handleGetReceipt(receiptNumber: string) {
  const { rows } = await query<{ receipt_data: string }>(
    `SELECT * FROM receipts WHERE receipt_number = $1`,
    [receiptNumber]
  );

  const row = rows[0];
  if (!row) return errorResponse('Receipt not found', 404);

  return successResponse(JSON.parse(row.receipt_data));
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const user = await authenticateRequest(req);
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const receiptNumber = pathParts[pathParts.length - 1];

    if (req.method === 'GET' && receiptNumber && receiptNumber !== 'receipts') {
      return await handleGetReceipt(receiptNumber);
    } else if (req.method === 'GET') {
      return await handleList(user);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message);
  }
});

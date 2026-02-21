import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, UserPayload } from "../_shared/auth.ts";
import { query } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

interface Product {
  id: number;
  item_code: string;
  description: string;
  quantity: number;
  buying_price: number;
  regular_price: number;
  discount_price: number;
  profit_per_item: number;
  low_stock_threshold: number;
}

async function logInventoryChange(
  productId: number,
  itemCode: string,
  description: string,
  changeType: string,
  quantityChanged: number,
  beforeQuantity: number,
  afterQuantity: number,
  userId: number,
  notes: string
) {
  try {
    await query(
      `INSERT INTO inventory_audit (product_id, item_code, description, change_type, quantity_changed,
       before_quantity, after_quantity, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [productId, itemCode, description, changeType, quantityChanged, beforeQuantity, afterQuantity, userId, notes]
    );
  } catch (err) {
    console.error('Failed to log inventory change:', err);
  }
}

async function handleSearch(url: URL, user: UserPayload) {
  const searchQuery = url.searchParams.get('q') || '';
  const sql = `SELECT * FROM products WHERE item_code ILIKE $1 OR description ILIKE $2 LIMIT 20`;
  const params = [`%${searchQuery}%`, `%${searchQuery}%`];

  const { rows } = await query<Product>(sql, params);
  return successResponse(rows);
}

async function handleList(url: URL, user: UserPayload) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = (page - 1) * limit;
  const lowStock = url.searchParams.get('lowStock') === 'true';

  let sql = `SELECT * FROM products`;
  const params: unknown[] = [];

  if (lowStock) {
    sql += ` WHERE quantity <= low_stock_threshold`;
  }

  sql += ` ORDER BY description ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await query<Product>(sql, params);
  return successResponse(rows);
}

async function handleCreate(req: Request, user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { item_code, description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } =
    await req.json();

  // Validation
  if (!item_code || item_code.trim() === '') return errorResponse('Item code is required', 400);
  if (!description || description.trim() === '') return errorResponse('Description is required', 400);
  if (isNaN(quantity) || quantity < 0) return errorResponse('Quantity must be a positive number', 400);
  if (isNaN(buying_price) || buying_price < 0) return errorResponse('Buying price must be a positive number', 400);
  if (isNaN(regular_price) || regular_price < 0) return errorResponse('Regular price must be a positive number', 400);
  if (isNaN(discount_price) || discount_price < 0) return errorResponse('Discount price must be a positive number', 400);

  const profit_per_item = regular_price - buying_price;

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO products (item_code, description, quantity, buying_price, regular_price,
                            discount_price, profit_per_item, low_stock_threshold, discount_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 7) RETURNING id`,
      [item_code, description, quantity, buying_price, regular_price, discount_price, profit_per_item, low_stock_threshold || 5]
    );

    const productId = rows[0].id;
    await logInventoryChange(
      productId,
      item_code,
      description,
      'RESTOCK',
      parseInt(quantity),
      0,
      parseInt(quantity),
      user.id,
      'Initial stock'
    );

    return successResponse({ id: productId, message: 'Product added successfully' });
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('UNIQUE')) {
      return errorResponse('Item code already exists', 400);
    }
    return errorResponse('Failed to add product');
  }
}

async function handleUpdate(req: Request, user: UserPayload, productId: string) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } =
    await req.json();

  // Validation
  if (!description || description.trim() === '') return errorResponse('Description is required', 400);
  if (isNaN(quantity) || quantity < 0) return errorResponse('Quantity must be a positive number', 400);
  if (isNaN(buying_price) || buying_price < 0) return errorResponse('Buying price must be a positive number', 400);
  if (isNaN(regular_price) || regular_price < 0) return errorResponse('Regular price must be a positive number', 400);
  if (isNaN(discount_price) || discount_price < 0) return errorResponse('Discount price must be a positive number', 400);

  const profit_per_item = regular_price - buying_price;

  const { rows: oldProductRows } = await query<Product>('SELECT * FROM products WHERE id = $1', [productId]);
  const oldProduct = oldProductRows[0];
  if (!oldProduct) return errorResponse('Product not found', 404);

  await query(
    `UPDATE products
     SET description = $1, quantity = $2, buying_price = $3, regular_price = $4,
         discount_price = $5, profit_per_item = $6, low_stock_threshold = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8`,
    [description, quantity, buying_price, regular_price, discount_price, profit_per_item, low_stock_threshold, productId]
  );

  if (oldProduct.quantity !== parseInt(quantity)) {
    await logInventoryChange(
      parseInt(productId),
      oldProduct.item_code,
      description,
      'EDIT',
      parseInt(quantity) - oldProduct.quantity,
      oldProduct.quantity,
      parseInt(quantity),
      user.id,
      'Manual edit'
    );
  }

  return successResponse({ message: 'Product updated successfully' });
}

async function handleDelete(user: UserPayload, productId: string) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { rows } = await query<{ count: string }>('SELECT COUNT(*) as count FROM sale_items WHERE product_id = $1', [productId]);
  const count = parseInt(rows[0].count);

  if (count > 0) {
    return errorResponse(`Cannot delete product with sales history (${count} sales)`, 400);
  }

  const result = await query('DELETE FROM products WHERE id = $1', [productId]);
  return successResponse({ message: 'Product deleted successfully' });
}

async function handleCheckSales(user: UserPayload, productId: string) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const { rows } = await query<{ count: string }>('SELECT COUNT(*) as count FROM sale_items WHERE product_id = $1', [productId]);
  return successResponse({
    hasSales: parseInt(rows[0].count) > 0,
    salesCount: parseInt(rows[0].count)
  });
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
    const path = url.pathname;
    const method = req.method;

    // Extract product ID if present in path
    const pathParts = path.split('/');
    const productId = pathParts[pathParts.length - 1];
    const isNumericId = !isNaN(Number(productId));

    // Route based on method and path
    if (method === 'GET' && url.searchParams.has('q')) {
      return await handleSearch(url, user);
    } else if (method === 'GET' && path.includes('/has-sales') && isNumericId) {
      return await handleCheckSales(user, productId);
    } else if (method === 'GET') {
      return await handleList(url, user);
    } else if (method === 'POST') {
      return await handleCreate(req, user);
    } else if (method === 'PUT' && isNumericId) {
      return await handleUpdate(req, user, productId);
    } else if (method === 'DELETE' && isNumericId) {
      return await handleDelete(user, productId);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('Products error:', err);
    return errorResponse(err.message);
  }
});

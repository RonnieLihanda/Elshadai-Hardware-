import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, UserPayload } from "../_shared/auth.ts";
import { getDbClient } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

interface SaleItem {
  product_id?: number;
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  profit: number;
  item_code?: string;
  buying_price?: number;
  discount_applied?: boolean;
}

async function logInventoryChange(
  client: any,
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
    await client.queryObject(
      `INSERT INTO inventory_audit (product_id, item_code, description, change_type, quantity_changed,
       before_quantity, after_quantity, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [productId, itemCode, description, changeType, quantityChanged, beforeQuantity, afterQuantity, userId, notes]
    );
  } catch (err) {
    console.error('Failed to log inventory change:', err);
  }
}

async function handleCreateSale(req: Request, user: UserPayload) {
  const { items, total_amount, total_profit, payment_method, mpesa_reference, customer_phone, manual_discount = 0 } =
    await req.json();

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse('Sale must contain at least one item', 400);
  }
  if (isNaN(total_amount) || total_amount < 0) {
    return errorResponse('Invalid total amount', 400);
  }

  if (!['cash', 'mpesa'].includes(payment_method)) {
    return errorResponse('Invalid payment method', 400);
  }

  if (payment_method === 'mpesa' && !customer_phone) {
    return errorResponse('Phone number required for M-Pesa', 400);
  }

  const seller_id = user.id;
  const receipt_number = `RCP-${Date.now()}`;
  const client = await getDbClient();

  try {
    // 1. Verify Stock & Prepare Items
    const processedItems: SaleItem[] = [];
    for (const item of items) {
      const result = await client.queryObject<any>('SELECT * FROM products WHERE id = $1', [item.product_id || item.id]);
      const product = result.rows[0];

      if (!product) throw new Error(`Product not found: ${item.description}`);
      if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.description}`);

      processedItems.push({
        ...item,
        product_id: product.id,
        item_code: product.item_code,
        description: product.description,
        buying_price: product.buying_price,
        discount_applied: item.quantity >= (product.discount_threshold || 7),
      });
    }

    // 2. Handle Customer
    let customerId = null;
    let customerDiscountPercent = 0;
    let cleanPhone = null;

    if (customer_phone) {
      cleanPhone = customer_phone.replace(/\s+/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

      const custResult = await client.queryObject<any>('SELECT * FROM customers WHERE phone_number = $1', [cleanPhone]);
      let customer = custResult.rows[0];

      if (customer) {
        customerId = customer.id;
        if (customer.is_eligible_for_discount) customerDiscountPercent = customer.discount_percentage;
      } else {
        const custRes = await client.queryObject<{ id: number }>(
          'INSERT INTO customers (phone_number, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id',
          [cleanPhone]
        );
        customerId = custRes.rows[0].id;
      }
    }

    // Apply customer discount if any
    let discountAmount = 0;
    let finalTotal = total_amount;
    let finalProfit = total_profit;

    if (customerDiscountPercent > 0) {
      discountAmount = (total_amount * customerDiscountPercent) / 100;
      finalTotal = total_amount - discountAmount;
      finalProfit = total_profit - discountAmount;
    }

    // 3. Start Transaction
    await client.queryObject('BEGIN');

    try {
      // Insert Sale
      const saleRes = await client.queryObject<{ id: number }>(
        `INSERT INTO sales (receipt_number, seller_id, customer_id, payment_method, mpesa_reference, total_amount, total_profit, items_count, manual_discount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [receipt_number, seller_id, customerId, payment_method, mpesa_reference, finalTotal, finalProfit, items.length, manual_discount]
      );
      const sale_id = saleRes.rows[0].id;

      // Insert Items and Update Stock
      for (const item of processedItems) {
        await client.queryObject(
          `INSERT INTO sale_items (sale_id, product_id, item_code, description, quantity, unit_price, total_price, profit, discount_applied)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [sale_id, item.product_id, item.item_code, item.description, item.quantity, item.unit_price, item.total_price, item.profit, item.discount_applied ? 1 : 0]
        );

        const updateRes = await client.queryObject<{ quantity: number }>(
          `UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING quantity`,
          [item.quantity, item.product_id]
        );
        const newQuantity = updateRes.rows[0].quantity;

        // Audit log
        await logInventoryChange(
          client,
          item.product_id!,
          item.item_code!,
          item.description,
          'SALE',
          -item.quantity,
          newQuantity + item.quantity,
          newQuantity,
          seller_id,
          `Sale ${receipt_number}`
        );
      }

      if (discountAmount > 0 && customerId) {
        await client.queryObject(
          'INSERT INTO customer_discounts (customer_id, sale_id, discount_amount, discount_percentage) VALUES ($1, $2, $3, $4)',
          [customerId, sale_id, discountAmount, customerDiscountPercent]
        );
      }

      if (customerId) {
        const mpesa_inc = payment_method === 'mpesa' ? 1 : 0;
        const mpesa_spent = payment_method === 'mpesa' ? finalTotal : 0;
        await client.queryObject(
          `UPDATE customers
           SET mpesa_purchases_count = mpesa_purchases_count + $1,
               total_mpesa_spent = total_mpesa_spent + $2,
               total_purchases_count = total_purchases_count + 1,
               total_spent = total_spent + $3,
               last_purchase_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [mpesa_inc, mpesa_spent, finalTotal, customerId]
        );
      }

      await client.queryObject('COMMIT');

      // Post-sale: Store receipt
      const receiptData = {
        receipt_number,
        seller_name: user.fullName,
        items: processedItems,
        total_amount: finalTotal,
        original_amount: total_amount,
        discount_amount: discountAmount,
        discount_percentage: customerDiscountPercent,
        payment_method,
        mpesa_reference,
        customer_phone: cleanPhone,
        created_at: new Date().toISOString(),
      };

      await client.queryObject(
        `INSERT INTO receipts (receipt_number, sale_id, receipt_data) VALUES ($1, $2, $3)`,
        [receipt_number, sale_id, JSON.stringify(receiptData)]
      );

      return successResponse({
        id: sale_id,
        receipt_number,
        message: 'Sale completed successfully',
        ...receiptData,
      });
    } catch (err) {
      await client.queryObject('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Sale failed:', error);
    return errorResponse(error.message);
  } finally {
    await client.end();
  }
}

async function handleListSales(req: Request, user: UserPayload) {
  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const paymentMethod = url.searchParams.get('paymentMethod');
  const search = url.searchParams.get('search');

  let sql = `
    SELECT
      s.*,
      u.full_name as seller_name,
      c.phone_number as customer_phone
    FROM sales s
    JOIN users u ON s.seller_id = u.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (startDate) {
    sql += ` AND s.created_at::date >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    sql += ` AND s.created_at::date <= $${params.length + 1}`;
    params.push(endDate);
  }

  if (paymentMethod && paymentMethod !== 'all') {
    sql += ` AND s.payment_method = $${params.length + 1}`;
    params.push(paymentMethod);
  }

  if (search) {
    sql += ` AND (s.receipt_number ILIKE $${params.length + 1} OR c.phone_number ILIKE $${params.length + 2})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY s.created_at DESC LIMIT 500`;

  const client = await getDbClient();
  try {
    const result = await client.queryObject(sql, params);
    return successResponse(result.rows);
  } finally {
    await client.end();
  }
}

async function handleGetSaleDetails(saleId: string) {
  const client = await getDbClient();
  try {
    const result = await client.queryObject(`SELECT si.* FROM sale_items si WHERE si.sale_id = $1`, [saleId]);
    return successResponse(result.rows);
  } finally {
    await client.end();
  }
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
    const method = req.method;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const saleId = pathParts[pathParts.length - 1];

    if (method === 'POST') {
      return await handleCreateSale(req, user);
    } else if (method === 'GET' && !isNaN(Number(saleId))) {
      return await handleGetSaleDetails(saleId);
    } else if (method === 'GET') {
      return await handleListSales(req, user);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('Sales error:', err);
    return errorResponse(err.message);
  }
});

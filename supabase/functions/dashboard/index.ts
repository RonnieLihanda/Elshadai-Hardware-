import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, UserPayload } from "../_shared/auth.ts";
import { getDbClient } from "../_shared/database.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

async function handleStats(url: URL, user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const period = url.searchParams.get('period') || 'today';

  let dateFilter = "created_at::date = CURRENT_DATE";
  if (period === 'week') {
    dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
  } else if (period === 'month') {
    dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
  } else if (period === 'all') {
    dateFilter = "1=1";
  }

  const client = await getDbClient();

  try {
    const statsSql = `
      SELECT
        SUM(total_amount) as "totalSales",
        SUM(total_profit) as "totalProfit",
        COUNT(id) as "transactionCount"
      FROM sales
      WHERE ${dateFilter}
    `;

    const lowStockSql = `SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold`;
    const inventoryValueSql = `SELECT SUM(quantity * regular_price) as "totalValue" FROM products`;

    const topProductsSql = `
      SELECT si.description, si.item_code, SUM(si.quantity) as "totalSold"
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE ${dateFilter.replace('created_at', 's.created_at')}
      GROUP BY si.product_id, si.description, si.item_code
      ORDER BY "totalSold" DESC
      LIMIT 5
    `;

    const [statsRes, lowStockRes, inventoryRes, topProductsRes] = await Promise.all([
      client.queryObject(statsSql),
      client.queryObject(lowStockSql),
      client.queryObject(inventoryValueSql),
      client.queryObject(topProductsSql)
    ]);

    const stats: any = statsRes.rows[0];
    const lowStock: any = lowStockRes.rows[0];
    const inventory: any = inventoryRes.rows[0];
    const topProducts = topProductsRes.rows;

    const response = {
      totalSales: parseFloat(stats.totalSales) || 0,
      totalProfit: parseFloat(stats.totalProfit) || 0,
      transactionCount: parseInt(stats.transactionCount) || 0,
      lowStockCount: parseInt(lowStock.count) || 0,
      totalInventoryValue: parseFloat(inventory.totalValue) || 0,
      topProducts: topProducts || []
    };

    return successResponse(response);
  } finally {
    await client.end();
  }
}

async function handleProductPerformance(url: URL, user: UserPayload) {
  const adminCheck = requireAdmin(user);
  if (adminCheck) return adminCheck;

  const period = url.searchParams.get('period') || 'today';

  let dateFilter = "s.created_at::date = CURRENT_DATE";
  if (period === 'week') {
    dateFilter = "s.created_at >= CURRENT_DATE - INTERVAL '7 days'";
  } else if (period === 'month') {
    dateFilter = "s.created_at >= CURRENT_DATE - INTERVAL '30 days'";
  } else if (period === 'all') {
    dateFilter = "1=1";
  }

  const sql = `
    SELECT
      p.description,
      p.item_code,
      p.quantity as current_stock,
      SUM(si.quantity) as total_sold,
      SUM(si.total_price) as total_revenue,
      SUM(si.profit) as total_profit
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE ${dateFilter}
    GROUP BY si.product_id, p.description, p.item_code, p.quantity
    ORDER BY total_sold DESC
    LIMIT 10
  `;

  const client = await getDbClient();
  try {
    const result = await client.queryObject(sql);
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
    const path = url.pathname;

    if (path.includes('/stats')) {
      return await handleStats(url, user);
    } else if (path.includes('/product-performance')) {
      return await handleProductPerformance(url, user);
    }

    return errorResponse('Endpoint not found', 404);
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse(err.message);
  }
});

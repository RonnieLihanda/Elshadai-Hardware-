# Frontend API Changes Guide

## Quick Summary

**Main Change**: Remove `/api` prefix from all API calls and update the base URL.

**Old Base URL**: `https://backend-one-chi-97.vercel.app/api`
**New Base URL**: `https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1`

## Environment Variable

Update `frontend/.env`:

```env
# Old
VITE_API_URL=https://backend-one-chi-97.vercel.app/api

# New
VITE_API_URL=https://vphdxmxcwbpkvppytrjn.supabase.co/functions/v1
```

## API Call Changes

### 1. Authentication

#### Login
```javascript
// Before
fetch(`${API_URL}/auth/login`, { ... })

// After
fetch(`${API_URL}/auth-login`, { ... })
```

#### Get Current User
```javascript
// Before
fetch(`${API_URL}/auth/me`, { ... })

// After
fetch(`${API_URL}/auth-me`, { ... })
```

### 2. Products

#### List Products
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/products?page=1&limit=100`, { ... })
```

#### Search Products
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/products?q=${searchQuery}`, { ... })
```

#### Create Product
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/products`, {
  method: 'POST',
  body: JSON.stringify(productData)
})
```

#### Update Product
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/products/${id}`, {
  method: 'PUT',
  body: JSON.stringify(productData)
})
```

#### Delete Product
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/products/${id}`, {
  method: 'DELETE'
})
```

### 3. Sales

#### Create Sale
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/sales`, {
  method: 'POST',
  body: JSON.stringify(saleData)
})
```

#### List Sales
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/sales?startDate=2026-01-01&endDate=2026-12-31`, { ... })
```

#### Get Sale Details
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/sales/${saleId}`, { ... })
```

### 4. Dashboard

#### Get Stats
```javascript
// Before
fetch(`${API_URL}/dashboard/stats?period=today`, { ... })

// After
fetch(`${API_URL}/dashboard?action=stats&period=today`, { ... })
```

#### Get Product Performance
```javascript
// Before
fetch(`${API_URL}/dashboard/product-performance?period=week`, { ... })

// After
fetch(`${API_URL}/dashboard?action=product-performance&period=week`, { ... })
```

### 5. Customers

#### Lookup Customer
```javascript
// Before
fetch(`${API_URL}/customers/lookup?phone=0712345678`, { ... })

// After
fetch(`${API_URL}/customers?phone=0712345678`, { ... })
```

#### List Customers
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/customers`, { ... })
```

### 6. Users

#### List Users
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/users`, { ... })
```

#### Change Password
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/users/${userId}/password`, {
  method: 'PUT',
  body: JSON.stringify({ new_password })
})
```

### 7. Receipts

#### List Receipts
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/receipts`, { ... })
```

#### Get Specific Receipt
```javascript
// Before & After - NO CHANGE
fetch(`${API_URL}/receipts/${receiptNumber}`, { ... })
```

## Pattern Recognition

Most endpoints work **exactly the same**, just:
1. Update `.env` file with new base URL
2. Change `/auth/login` → `/auth-login`
3. Change `/auth/me` → `/auth-me`
4. Change `/dashboard/stats` → `/dashboard?action=stats`
5. Change `/dashboard/product-performance` → `/dashboard?action=product-performance`
6. Change `/customers/lookup?phone=` → `/customers?phone=`

Everything else works as-is! 🎉

## Search & Replace Guide

If you want to do a quick find-and-replace in your frontend code:

1. **Update auth endpoints**:
   - Find: `/api/auth/login`
   - Replace: `/auth-login`

   - Find: `/api/auth/me`
   - Replace: `/auth-me`

2. **Update dashboard endpoints**:
   - Find: `/api/dashboard/stats`
   - Replace: `/dashboard?action=stats`

   - Find: `/api/dashboard/product-performance`
   - Replace: `/dashboard?action=product-performance`

3. **Update customer lookup**:
   - Find: `/api/customers/lookup`
   - Replace: `/customers`

4. **Remove /api prefix from everything else**:
   - Find: `/api/products`
   - Replace: `/products`

   - Find: `/api/sales`
   - Replace: `/sales`

   - Find: `/api/users`
   - Replace: `/users`

   - Find: `/api/receipts`
   - Replace: `/receipts`

   - Find: `/api/customers`
   - Replace: `/customers`

## Headers Stay The Same

All headers remain unchanged:

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

## Error Handling

Response format is identical:

```javascript
// Success
{ status: 'ok', data: [...] }

// Error
{ error: 'Error message' }
```

## Testing

After making changes, test each feature:

1. ✅ Login
2. ✅ Product search
3. ✅ Create sale
4. ✅ View dashboard
5. ✅ Manage customers
6. ✅ User management
7. ✅ View receipts

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` file has correct URL
3. Check Network tab to see actual request URLs
4. View Edge Function logs: `supabase functions logs --follow`

---

**Pro Tip**: Since most endpoints don't change, you might only need to update 5-10 lines of code in your entire frontend! 🚀

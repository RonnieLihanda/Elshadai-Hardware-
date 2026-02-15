# Elshadai Hardware POS System

A complete Point of Sale system for Elshadai Hardware store in Musembe, Eldoret, Kenya.

## Features

- 🛒 **Fast POS Interface**: Quick product search and cart management.
- 💰 **Bulk Discount Logic**: Automatic pricing switch for bulk purchases (7+ items of the same product).
- 📈 **Dynamic Profit Calculation**: Real-time profit tracking based on applied price tiers.
- 📊 **Admin Dashboard**: Comprehensive analytics on sales, profit, and inventory value.
- 📝 **Receipt Generation**: Professional receipts with transaction details and persistent storage.
- 👥 **User Management**: Admin control over user accounts and secure password resets.
- 📦 **Inventory Control**: Full CRUD operations for products directly from the UI.
- 📁 **Excel Integration**: Seed and sync inventory data using Excel files.
- 🔐 **Role-Based Security**: Secure access for Admins and Sellers via JWT.

## Quick Start (PowerShell)

### Backend
```powershell
cd backend; npm install; npm run dev
```

### Frontend
```powershell
cd frontend; npm install; npm run dev
```

Access at: http://localhost:5173

## Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Seller:**
- Username: `seller1`
- Password: `seller123`

## Technical Logic

### Bulk Discounting
The system automatically detects when 7 or more items of the same product are added to the cart:
- **1-6 Items**: Regular Price (mapped from Excel Column F).
- **7+ Items**: Bulk Discount Price (mapped from Excel Column G).
- **Receipts**: Annotated with an asterisk (*) when a bulk discount is applied.

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React 18, Vite, Lucide Icons
- **Authentication**: JsonWebToken (JWT), BcryptJS
- **Data**: ExcelJS for spreadsheet handling

## License

Proprietary - Elshadai Hardware, Musembe

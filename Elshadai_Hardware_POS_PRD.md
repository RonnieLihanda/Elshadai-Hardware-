# PRODUCT REQUIREMENTS DOCUMENT

# Elshadai Hardware POS System

**Version 1.0**

*Web-Based Point of Sale Application with Excel Integration*

---

## Document Overview

This document outlines the requirements for Elshadai Hardware's Point of Sale (POS) system, a web-based application designed for hardware retail management with Excel as the source of truth.

**Document Status:** Draft  
**Last Updated:** February 15, 2026  
**Owner:** Elshadai Hardware, Musembe

---

## 1. Executive Summary

### 1.1 Project Vision

Elshadai Hardware POS System is a web-based point of sale application that streamlines hardware retail operations while maintaining Excel as the single source of truth for inventory management. The system enables fast sales transactions, real-time inventory tracking, and comprehensive business analytics with role-based access control.

### 1.2 Key Objectives

- Fast, responsive POS interface for quick sales processing
- Real-time two-way synchronization with Excel inventory file
- Automatic inventory updates on sales and new stock entry
- Quick product search and price lookup functionality
- Role-based access control (Admin vs. Seller)
- Comprehensive profit tracking and business analytics
- High system reliability with minimal downtime

### 1.3 Success Metrics

- Sales transaction time under 30 seconds
- System uptime of 99.5% or higher
- Zero inventory discrepancies between Excel and system
- Product search results in under 1 second

---

## 2. Recommended Technical Architecture

### 2.1 Technology Stack

#### Frontend
- **React.js** - Fast, component-based UI framework
- **Tailwind CSS** - Responsive design and styling
- **React Query** - Efficient data fetching and caching
- **React Router** - Client-side routing

#### Backend
- **Node.js with Express.js** - API server
- **PostgreSQL** - Primary database for real-time operations
- **ExcelJS** - Excel file reading and writing
- **JWT** - Authentication and authorization

#### Deployment
- **Vercel or Netlify** - Frontend hosting
- **Render or Railway** - Backend API hosting
- **Supabase or Neon** - PostgreSQL hosting

### 2.2 Architecture Diagram

The system follows a three-tier architecture:

1. **Presentation Layer:** React.js web application running in browser
2. **Application Layer:** Node.js/Express API server handling business logic
3. **Data Layer:** PostgreSQL database + Excel file as source of truth

### 2.3 Excel Integration Strategy

#### Hybrid Data Approach

The system uses a hybrid data management approach combining database speed with Excel reliability:

- **PostgreSQL:** Handles real-time queries, fast searches, and transaction processing
- **Excel File:** Remains the authoritative source of truth, updated automatically
- **Sync Process:** Bidirectional synchronization ensures data consistency

#### Sync Operations

**Database to Excel (every transaction):**
- Sales update inventory quantities in both DB and Excel
- New stock entries append to Excel file
- Price changes reflected in Excel immediately

**Excel to Database (on manual upload):**
- Admin can upload updated Excel to refresh entire inventory
- System validates and imports all changes
- Conflict resolution interface for discrepancies

---

## 3. Core Features & Requirements

### 3.1 User Management & Authentication

#### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | • Full system access<br>• View all sales and profit data<br>• Access comprehensive dashboard<br>• Add/edit/delete inventory items<br>• Manage user accounts<br>• Upload/download Excel files<br>• Generate financial reports<br>• Modify prices and profit margins |
| **Seller** | • Process sales transactions<br>• Search products and check prices<br>• View product availability<br>• Print receipts<br>• View own sales history<br>• Cannot view profit data<br>• Cannot access admin dashboard<br>• Cannot modify inventory or prices |

#### Authentication Requirements

- Secure login with username and password
- JWT-based session management
- Auto-logout after 8 hours of inactivity
- Password change functionality
- Admin ability to reset user passwords

### 3.2 Point of Sale (POS) Interface

#### Quick Product Search

- Search by item code, description, or partial text
- Instant autocomplete suggestions
- Display: Item Code, Description, Available Quantity, Price
- Keyboard shortcuts for fast navigation
- Barcode scanner support (optional future enhancement)

#### Sale Transaction Flow

1. Seller searches for product
2. Selects item and enters quantity
3. System displays selling price and total
4. Can add multiple items to cart
5. Review cart and finalize sale
6. System updates inventory automatically
7. Generate printable receipt
8. Excel file updated in background

#### Cart Management

- Add/remove items from cart
- Edit quantities
- Display running subtotal
- Low stock warnings
- Prevent overselling (quantity validation)

#### Receipt Generation

- Business name and contact information
- Transaction date and time
- Unique receipt number
- Itemized list with quantities and prices
- Total amount
- Served by (seller name)
- Print and email options

### 3.3 Inventory Management

#### Inventory View

- Searchable and sortable product list
- Columns: Item Code, Description, Quantity, Buying Price, Selling Price, Profit
- Filter by low stock (customizable threshold)
- Pagination for large inventories
- Export to Excel functionality

#### Add New Inventory

- Form to add single items or bulk upload
- Required fields: Item Code, Description, Quantity, Buying Price, Selling Price
- Auto-calculate profit margin
- Validation for duplicate item codes
- Automatically sync to Excel file

#### Edit Inventory

- Modify prices, quantities, descriptions
- Track edit history (who changed what, when)
- Bulk price updates
- Changes reflected in Excel immediately

#### Stock Alerts

- Automatic low stock notifications
- Out of stock alerts
- Configurable threshold levels
- Dashboard widget showing critical stock levels

### 3.4 Admin Dashboard (Admin Only)

#### Key Metrics Display

- Total sales today/week/month
- Total profit today/week/month
- Number of transactions
- Top selling items
- Inventory value (total stock worth)
- Low stock items count

#### Sales Analytics

- Sales trend graphs (daily/weekly/monthly)
- Profit trend analysis
- Product performance comparison
- Seller performance tracking
- Date range filters

#### Reports Generation

- Daily sales report
- Inventory status report
- Profit and loss statement
- Product movement report
- Export reports as PDF or Excel

### 3.5 Excel Integration

#### Upload Excel

- Admin can upload updated Excel file
- System validates file structure and data
- Preview changes before importing
- Conflict resolution for existing items
- Complete database refresh on import

#### Download Excel

- Always get latest Excel file with current inventory
- Includes all columns from original format
- Maintains formulas and formatting
- Option to download filtered/selected data

#### Auto-Sync

- Every sale automatically updates Excel quantity
- New inventory items append to Excel
- Price changes reflected in Excel
- Background sync with retry mechanism
- Sync status indicator

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **Search Response:** Results in under 1 second
- **Page Load:** Initial load under 3 seconds
- **Transaction Processing:** Complete sale in under 30 seconds
- **Excel Sync:** Background sync completes within 5 seconds
- **Concurrent Users:** Support up to 10 simultaneous users

### 4.2 Reliability

- **Uptime:** 99.5% availability
- **Data Integrity:** Zero inventory discrepancies
- **Backup:** Automated daily database backups
- **Excel Versioning:** Keep last 7 days of Excel versions
- **Error Handling:** Graceful degradation with user notifications

### 4.3 Security

- Encrypted passwords (bcrypt hashing)
- HTTPS for all communications
- JWT token-based authentication
- Role-based access control (RBAC)
- Session timeout after inactivity
- Audit logs for sensitive operations

### 4.4 Usability

- Clean, intuitive interface
- Responsive design (desktop and tablet)
- Keyboard shortcuts for common actions
- Clear error messages and validation
- Loading indicators for all async operations
- Success confirmations for important actions

### 4.5 Maintainability

- Clean, well-documented code
- Modular architecture for easy updates
- Version control with Git
- Comprehensive logging system

---

## 5. Database Schema

### 5.1 Core Tables

#### Users Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(50) | Unique username |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| role | ENUM | 'admin' or 'seller' |
| full_name | VARCHAR(100) | User's full name |
| created_at | TIMESTAMP | Account creation date |
| is_active | BOOLEAN | Account active status |

#### Products Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| item_code | VARCHAR(50) | Unique item identifier |
| description | TEXT | Product description |
| quantity | INTEGER | Available quantity |
| buying_price | DECIMAL(10,2) | Cost per item (KES) |
| selling_price | DECIMAL(10,2) | Price per item (KES) |
| profit_per_item | DECIMAL(10,2) | Calculated profit (KES) |
| low_stock_threshold | INTEGER | Alert threshold |
| created_at | TIMESTAMP | Date added to system |
| updated_at | TIMESTAMP | Last modification date |

#### Sales Table

Stores completed sales transactions.

#### Sale_Items Table

Stores individual items in each sale (one-to-many relationship with Sales).

#### Audit_Log Table

Tracks all critical system operations for accountability and troubleshooting.

---

## 6. Development Roadmap

### 6.1 Phase 1: MVP (4-6 weeks)

- User authentication (admin and seller roles)
- Basic POS interface with product search
- Sales transaction processing
- Inventory viewing and basic management
- Excel upload/download functionality
- Automatic inventory updates on sales
- Basic admin dashboard with key metrics

### 6.2 Phase 2: Enhanced Features (3-4 weeks)

- Receipt generation and printing
- Advanced search with filters
- Low stock alerts
- Sales history and reports
- Bulk inventory operations
- Enhanced dashboard with analytics
- User management interface

### 6.3 Phase 3: Optimization & Polish (2-3 weeks)

- Performance optimization
- UI/UX improvements
- Mobile responsiveness
- Advanced reporting features
- Comprehensive testing
- Documentation and training materials

---

## 7. Future Enhancements

These features can be added after the initial launch:

- **Barcode scanning:** USB barcode scanner integration
- **Mobile app:** Native iOS/Android applications
- **Supplier management:** Track suppliers and purchase orders
- **Multi-location support:** Manage inventory across branches
- **Customer accounts:** Track customer purchase history
- **Credit sales:** Manage accounts receivable
- **SMS notifications:** Alert for low stock and other events
- **Advanced analytics:** Predictive inventory and sales forecasting
- **Integration with accounting:** QuickBooks, Xero, etc.

---

## 8. Appendix

### 8.1 Excel File Structure

The system works with the following Excel structure (13 columns):

| # | Column Name |
|---|-------------|
| 1 | Item Code |
| 2 | Description |
| 3 | Quantity |
| 4 | Buying Price (KES)-per Item |
| 5 | Buying Price (KES)- |
| 6 | Selling Price (KES)-per Item |
| 7 | Final selling price - Per Item |
| 8 | Selling Price (KES)-Total |
| 9 | Final selling price - total |
| 10 | Profit (KES)- per item |
| 11 | Final Profit (KES) -per item |
| 12 | Profit (KES)- total |
| 13 | Final Profit (KES) -total |

### 8.2 Sample User Workflow

#### Seller Making a Sale:

1. Logs in to system
2. Searches for 'Vesta Emulsion White'
3. Selects item, enters quantity (2)
4. Adds to cart (Total: 1,300 KES)
5. Finalizes sale
6. Prints receipt for customer
7. System updates inventory (9 → 7 units)
8. Excel file updated automatically

#### Admin Checking Daily Performance:

1. Logs in to system
2. Views dashboard
3. Sees today's sales: 15,000 KES
4. Sees today's profit: 4,500 KES
5. Checks top-selling items
6. Reviews low stock alerts (3 items)
7. Downloads updated Excel for records

---

**--- END OF DOCUMENT ---**

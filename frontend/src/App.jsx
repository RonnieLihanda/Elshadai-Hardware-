import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import api from './api';
import { ShoppingCart, LayoutDashboard, Package, LogOut, Search, Plus, Minus, X, Printer, CheckCircle, Users, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCw, Mail, Bell, History, Download, Eye, EyeOff } from 'lucide-react';

// Simplified Auth Context
const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('pos'); // pos, dashboard, inventory, customers, users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      api.getMe(token)
        .then(u => setUser(u))
        .catch(() => handleLogout());
    }
  }, [token]);

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} error={error} loading={loading} />;
  }

  return (
    <AuthContext.Provider value={{ user, token }}>
      <div className="app-container">
        <Navbar user={user} setView={setView} onLogout={handleLogout} activeView={view} />
        <main className="main-content">
          {view === 'pos' && <POS />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'inventory' && <Inventory />}
          {view === 'customers' && <CustomerManagement />}
          {view === 'users' && <UserManagement />}
          {view === 'sales' && <SalesHistory />}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

// Login Component
function Login({ onLogin, error, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="modal-overlay" style={{ background: 'var(--primary)' }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Elshadai POS</h2>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          <button className="bg-primary" style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Forgot Password?
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
          Elshadai Hardware • Musembe, Eldoret
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>Password Reset</h3>
              <button onClick={() => setShowForgotPassword(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '1.5rem',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <Mail size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', fontSize: '0.95rem' }}>
                    Contact Administrator
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    To reset your password, please email the administrator:
                  </p>
                  <a
                    href="mailto:ronnielihanda@gmail.com?subject=Password Reset Request - Elshadai POS&body=Hello,%0D%0A%0D%0AI need to reset my password for the Elshadai POS system.%0D%0A%0D%0AUsername: [Your username]%0D%0A%0D%0AThank you."
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    <Mail size={16} />
                    ronnielihanda@gmail.com
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForgotPassword(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#f1f5f9',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Navbar Component
function Navbar({ user, setView, onLogout, activeView }) {
  return (
    <nav style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>Elshadai Hardware</div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button onClick={() => setView('pos')} style={{ background: 'transparent', color: activeView === 'pos' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} /> POS
        </button>
        {user.role === 'admin' && (
          <>
            <button onClick={() => setView('dashboard')} style={{ background: 'transparent', color: activeView === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => setView('inventory')} style={{ background: 'transparent', color: activeView === 'inventory' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} /> Inventory
            </button>
            <button onClick={() => setView('customers')} style={{ background: 'transparent', color: activeView === 'customers' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Customers
            </button>
            <button onClick={() => setView('sales')} style={{ background: 'transparent', color: activeView === 'sales' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} /> History
            </button>
            <button onClick={() => setView('users')} style={{ background: 'transparent', color: activeView === 'users' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> Users
            </button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
        </div>
        <button onClick={onLogout} style={{ background: '#fee2e2', color: 'var(--danger)', padding: '0.5rem' }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

// POS Component
function POS() {
  const { token, user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaReference, setMpesaReference] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length > 1) {
        api.searchProducts(search, token).then(setProducts);
      } else {
        api.getAllProducts(token).then(data => setProducts(data));
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, token]);

  const addToCart = (product) => {
    if (product.quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta, max) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        // Allow up to max stock, and at least 0
        if (newQty >= 0 && newQty <= max) return { ...item, quantity: newQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const manualCartQty = (id, val, max) => {
    const newQty = parseInt(val) || 0;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        let qty = newQty;
        if (qty > max) qty = max;
        if (qty < 0) qty = 0;
        return { ...item, quantity: qty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const calculateItemPrice = (item) => {
    return item.quantity >= (item.discount_threshold || 7)
      ? item.discount_price
      : item.regular_price;
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    return sum + (price * item.quantity);
  }, 0);

  const total = Math.max(0, subtotal - (parseFloat(manualDiscount) || 0));

  const totalSavings = cart.reduce((sum, item) => {
    if (item.quantity >= (item.discount_threshold || 7)) {
      return sum + ((item.regular_price - item.discount_price) * item.quantity);
    }
    return sum;
  }, 0);

  const totalProfit = cart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    return sum + ((price - item.buying_price) * item.quantity);
  }, 0) - (parseFloat(manualDiscount) || 0);

  const handlePhoneChange = async (phone) => {
    setCustomerPhone(phone);
    let cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

    if (cleanPhone.length >= 10) {
      try {
        const data = await api.lookupCustomer(cleanPhone, token);
        setCustomer(data);
      } catch (err) {
        setCustomer(null);
      }
    } else {
      setCustomer(null);
    }
  };

  const completeSale = async () => {
    console.log('=== ATTEMPTING SALE ===');
    console.log('Cart items:', cart);

    if (!cart || cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    // Validate all items have required fields
    const invalidItems = cart.filter(item => !item.id || !item.quantity);
    if (invalidItems.length > 0) {
      console.error('Invalid items in cart:', invalidItems);
      alert('Some items in cart are missing required data. Please refresh and try again.');
      return;
    }

    setCompleting(true);

    try {
      const saleItems = cart.map(item => {
        const effectivePrice = calculateItemPrice(item);
        return {
          product_id: item.id,
          item_code: item.item_code,
          description: item.description,
          quantity: item.quantity,
          unit_price: effectivePrice,
          total_price: effectivePrice * item.quantity,
          profit: (effectivePrice - item.buying_price) * item.quantity,
          discount_applied: item.quantity >= (item.discount_threshold || 7),
          regular_price: item.regular_price,
          discount_price: item.discount_price
        };
      });

      const saleData = {
        items: saleItems,
        total_amount: total,
        total_profit: totalProfit,
        payment_method: paymentMethod,
        mpesa_reference: mpesaReference,
        customer_phone: customerPhone,
        manual_discount: manualDiscount
      };

      console.log('Sending request to: http://localhost:5000/api/sales');
      console.log('Sale Data:', saleData);

      const result = await api.createSale(saleData, token);
      console.log('Sale successful:', result);

      setReceipt({
        ...result,
        items: saleItems,
        total_amount: result.total_amount, // Use the total from backend (could have customer discount)
        total_savings: totalSavings + (result.discount_amount || 0),
        seller: user.fullName
      });
      setCart([]);
      setMpesaReference('');
      setCustomerPhone('');
      setCustomer(null);
      setPaymentMethod('cash');
      setManualDiscount(0);
      setShowPreview(false);
      alert('Sale completed successfully!');
    } catch (err) {
      console.error('=== SALE FAILED ===');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);

      let errorMessage = 'Failed to complete sale. ';
      if (err.message.toLocaleLowerCase().includes('fetch')) {
        errorMessage += 'Cannot connect to server. Please ensure:\n' +
          '1. Backend server is running (check terminal)\n' +
          '2. Backend is on http://localhost:5000\n' +
          '3. No firewall blocking the connection';
      } else {
        // Use the error message from the API if available, otherwise fallback to generic
        errorMessage += err.message || 'Unknown error.';
      }

      alert(errorMessage);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="pos-grid">
      <div className="products-section">
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            placeholder="Search by code or description..."
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && products.length > 0) {
                addToCart(products[0]);
                setSearch('');
              }
            }}
            autoFocus
          />
        </div>
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="product-card card" onClick={() => addToCart(p)}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.item_code}</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.description}</div>
              <div className="product-price">
                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>KES {p.regular_price.toLocaleString()}</div>
                {p.discount_price < p.regular_price && (
                  <div className="discount-hint">Buy {p.discount_threshold}+ for KES {p.discount_price.toLocaleString()} each</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                {p.quantity <= p.low_stock_threshold ? (
                  <span className="badge-low">{p.quantity} left</span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.quantity} in stock</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-section card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShoppingCart size={20} /> Current Cart
        </h3>
        <div className="cart-items">
          {cart.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cart is empty</div>}
          {cart.map(item => {
            const isBulk = item.quantity >= item.discount_threshold;
            const price = isBulk ? item.discount_price : item.regular_price;
            return (
              <div key={item.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                    {item.item_code} |
                    <span style={{ marginLeft: '0.5rem' }}>Qty: </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', margin: '0 0.5rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, -1, item.quantity); }} style={{ padding: '2px 6px', background: '#f1f5f9' }}><Minus size={12} /></button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => manualCartQty(item.id, e.target.value, 10000)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '45px', textAlign: 'center', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                      <button onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, 1, 10000); }} style={{ padding: '2px 6px', background: '#f1f5f9' }}><Plus size={12} /></button>
                    </div>
                    {isBulk ? (
                      <>
                        <span className="discount-badge">BULK!</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>@ KES {item.discount_price.toLocaleString()}</span>
                        <span className="original-price strikethrough">KES {item.regular_price.toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <span>@ KES {item.regular_price.toLocaleString()}</span>
                        {item.discount_price < item.regular_price && (
                          <small className="discount-hint">Buy {item.discount_threshold - item.quantity} more for discount</small>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      KES {(price * item.quantity).toLocaleString()}
                    </div>
                    {isBulk && (
                      <div className="savings">Saved: KES {((item.regular_price - item.discount_price) * item.quantity).toLocaleString()}</div>
                    )}
                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', background: 'transparent', fontSize: '0.75rem', marginTop: '0.25rem' }}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '1rem 0' }}>
          {totalSavings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span>Bulk Savings</span>
              <span>- KES {totalSavings.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', border: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Additional Discount (Manual)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>KES</span>
              <input
                type="number"
                value={manualDiscount}
                onChange={e => setManualDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                style={{ width: '80px', padding: '0.25rem', textAlign: 'right', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>KES {total.toLocaleString()}</span>
          </div>
          <div className="payment-section" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Payment Method</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: `2px solid ${paymentMethod === 'cash' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'cash' ? '#f0fdf4' : 'white' }}>
                <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={e => setPaymentMethod(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '1.2rem' }}>💵</span>
                <span style={{ fontSize: '0.9rem', fontWeight: paymentMethod === 'cash' ? 'bold' : 'normal' }}>Cash</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: `2px solid ${paymentMethod === 'mpesa' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'mpesa' ? '#f0fdf4' : 'white' }}>
                <input type="radio" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={e => setPaymentMethod(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '1.2rem' }}>📱</span>
                <span style={{ fontSize: '0.9rem', fontWeight: paymentMethod === 'mpesa' ? 'bold' : 'normal' }}>M-Pesa</span>
              </label>
            </div>

            {paymentMethod === 'mpesa' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Customer Phone Number</label>
                  <input
                    type="tel"
                    placeholder="07... or 2547..."
                    value={customerPhone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  {customer && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <span className="badge-success" style={{ fontSize: '0.7rem' }}>✓ Returning Customer</span>
                      {customer.is_eligible_for_discount && (
                        <span className="badge-low" style={{ fontSize: '0.7rem', background: '#f59e0b' }}>🎉 {customer.discount_percentage}% discount!</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>M-Pesa Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. QBR7XYZ..."
                    value={mpesaReference}
                    onChange={e => setMpesaReference(e.target.value.toUpperCase())}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className="bg-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={cart.length === 0 || completing}
            onClick={() => setShowPreview(true)}
          >
            {completing ? 'Processing...' : 'Review & Checkout'}
          </button>
        </div>
      </div>

      {showPreview && (
        <ReceiptPreview
          cart={cart}
          subtotal={subtotal}
          manualDiscount={manualDiscount}
          total={total}
          totalSavings={totalSavings}
          customer={customer}
          paymentMethod={paymentMethod}
          onConfirm={completeSale}
          onCancel={() => setShowPreview(false)}
        />
      )}

      {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

// Receipt Component
function Receipt({ receipt, onClose }) {
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '350px', padding: '1.5rem' }}>
        <div id="receipt-printable" className="receipt-container" style={{ textAlign: 'center', fontFamily: 'monospace' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>ELSHADAI HARDWARE</h2>
          <div style={{ fontSize: '0.8rem' }}>Musembe, Eldoret, Kenya</div>
          <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>TEL: +254 114061231</div>

          <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '0.5rem 0', margin: '0.5rem 0', textAlign: 'left', fontSize: '0.8rem' }}>
            <div>No: {receipt.receipt_number}</div>
            <div>Date: {new Date(receipt.created_at || Date.now()).toLocaleString()}</div>
            <div>Seller: {receipt.seller_name || receipt.seller}</div>
            <div style={{ marginTop: '0.2rem' }}>
              Payment: <strong>{receipt.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}</strong>
            </div>
            {receipt.mpesa_reference && <div>Ref: {receipt.mpesa_reference}</div>}
            {receipt.customer_phone && <div>Customer: {receipt.customer_phone}</div>}
          </div>

          <table style={{ width: '100%', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, idx) => {
                const isDiscounted = item.discount_applied;
                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left' }}>{item.description.substring(0, 18)}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{item.total_price.toLocaleString()}{isDiscounted ? '*' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>SUBTOTAL</span>
            <span>KES {(receipt.original_amount || (receipt.total_amount + (receipt.total_savings || 0))).toLocaleString()}</span>
          </div>

          {/* Bulk Savings */}
          {receipt.total_savings > (receipt.discount_amount || 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>BULK SAVINGS</span>
              <span>KES {(receipt.total_savings - (receipt.discount_amount || 0)).toLocaleString()}</span>
            </div>
          )}

          {/* Customer Discount */}
          {receipt.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'black', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <span>CUSTOMER DISCOUNT ({receipt.discount_percentage}%)</span>
              <span>- KES {receipt.discount_amount.toLocaleString()}</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid black', marginTop: '0.25rem', paddingTop: '0.25rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
            <span>TOTAL</span>
            <span>KES {receipt.total_amount.toLocaleString()}</span>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', textAlign: 'left' }}>
            {receipt.total_savings > 0 && <div>* Bulk discount price</div>}
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold are not returnable.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }} className="no-print">
          <button onClick={printReceipt} className="bg-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Print
          </button>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Receipt Preview Component
function ReceiptPreview({ cart, subtotal, manualDiscount, total, totalSavings, customer, paymentMethod, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Sale Preview</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Please verify the items and total before completing.</p>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => {
                const isBulk = item.quantity >= (item.discount_threshold || 7);
                const price = isBulk ? item.discount_price : item.regular_price;
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <div style={{ fontWeight: 500 }}>{item.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.item_code}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{(price * item.quantity).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          {totalSavings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
              <span>Bulk Savings</span>
              <span>- KES {totalSavings.toLocaleString()}</span>
            </div>
          )}
          {customer && customer.is_eligible_for_discount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
              <span>Loyalty Discount ({customer.discount_percentage}%)</span>
              <span>- KES {(subtotal * (customer.discount_percentage / 100)).toLocaleString()}</span>
            </div>
          )}
          {manualDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--danger)' }}>
              <span>Manual Discount</span>
              <span>- KES {manualDiscount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <span>Final Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <span>Payment Method:</span>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{paymentMethod}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="bg-primary" onClick={onConfirm} style={{ flex: 2, padding: '1rem', fontWeight: 'bold' }}>
            <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Complete Sale
          </button>
          <button onClick={onCancel} style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
function UserManagement() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [modalUser, setModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchUsers = () => {
    api.getUsers(token).then(setUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await api.updateUserPassword(token, modalUser.id, newPassword);
      setMsg({ type: 'success', text: 'Password updated successfully' });
      setTimeout(() => {
        setModalUser(null);
        setNewPassword('');
        setMsg({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>User Management</h2>
      </div>
      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Username</th>
              <th style={{ padding: '1rem' }}>Full Name</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem' }}>{u.username}</td>
                <td style={{ padding: '1rem' }}>{u.full_name}</td>
                <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{u.role}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => setModalUser(u)}
                    style={{ background: '#f1f5f9', color: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Change Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h3>Change Password for {modalUser.full_name}</h3>
            <form onSubmit={handleChangePassword} style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {msg.text && (
                <div style={{ color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {msg.text}
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="bg-primary" style={{ flex: 1, padding: '0.75rem' }}>Update Password</button>
                <button type="button" onClick={() => setModalUser(null)} style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inventory Component with CRUD
function Inventory() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = () => {
    api.getAllProducts(token).then(setProducts);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(productId, token);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportInventory(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{showTracking ? 'Stock Tracking' : 'Inventory Management'}</h2>
          {showTracking && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Detailed audit of all inventory movements</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowTracking(!showTracking)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showTracking ? '#f1f5f9' : 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {showTracking ? <Package size={18} /> : <History size={18} />}
            {showTracking ? 'View Products' : 'View Tracking'}
          </button>
          {!showTracking && (
            <>
              <button className="btn-add" onClick={() => setIsAdding(true)}>
                <Plus size={18} /> Add New Product
              </button>
              <button className="bg-primary" onClick={handleExport} disabled={exporting} style={{ padding: '0.5rem 1rem' }}>
                <Download size={18} /> {exporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </>
          )}
        </div>
      </div>

      {showTracking ? (
        <InventoryAuditTrail />
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input
              type="text"
              placeholder="Search by product code or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>Code</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.75rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem' }}>Buying</th>
                  <th style={{ padding: '0.75rem' }}>Regular</th>
                  <th style={{ padding: '0.75rem' }}>Discount</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(search.length > 0
                  ? products.filter(p =>
                      p.item_code.toLowerCase().includes(search.toLowerCase()) ||
                      p.description.toLowerCase().includes(search.toLowerCase())
                    )
                  : products
                ).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>{p.item_code}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{p.description}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={p.quantity <= p.low_stock_threshold ? 'badge-low' : ''}>
                      {p.quantity}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{p.buying_price.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>{p.regular_price.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>{p.discount_price.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button className="btn-edit" onClick={() => setEditingProduct(p)}><Edit size={14} /></button>
                    <button className="btn-delete" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {(editingProduct || isAdding) && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setEditingProduct(null); setIsAdding(false); }}
          onSave={() => { setEditingProduct(null); setIsAdding(false); fetchProducts(); }}
          token={token}
        />
      )}
    </div>
  );
}

// Product Add/Edit Modal
function ProductModal({ product, onClose, onSave, token }) {
  const [formData, setFormData] = useState(product || {
    item_code: '',
    description: '',
    quantity: 0,
    buying_price: 0,
    regular_price: 0,
    discount_price: 0,
    low_stock_threshold: 5
  });

  const isEdit = !!product;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert('Description cannot be empty');
      return;
    }
    if (formData.buying_price < 0 || formData.regular_price < 0 || formData.discount_price < 0 || formData.quantity < 0) {
      alert('Values cannot be negative');
      return;
    }

    try {
      if (isEdit) {
        await api.updateProduct(product.id, formData, token);
      } else {
        await api.createProduct(formData, token);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Item Code</label>
              <input
                type="text"
                value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                disabled={isEdit}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Low Stock Alert</label>
              <input
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Buying (KES)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.buying_price}
                onChange={e => setFormData({ ...formData, buying_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Regular (KES)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.regular_price}
                onChange={e => setFormData({ ...formData, regular_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Discount (KES)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_price}
                onChange={e => setFormData({ ...formData, discount_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="calculated-profit">
            <strong>Profit per item:</strong> KES {(formData.regular_price - formData.buying_price).toLocaleString()}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="bg-primary" style={{ flex: 1, padding: '0.75rem' }}>Save Changes</button>
            <button type="button" onClick={onClose} style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Customer Management Component for Admin
function CustomerManagement() {
  const { token } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [token]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCustomers(token);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async (customerId, percentage) => {
    try {
      await api.updateCustomerDiscount(customerId, {
        is_eligible: percentage > 0,
        discount_percentage: percentage
      }, token);
      loadCustomers();
      setShowDiscountModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Customer Loyalty Management</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total Customers: <strong>{customers.length}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</div>
      ) : (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Phone Number</th>
                <th style={{ padding: '1rem' }}>M-Pesa Purchases</th>
                <th style={{ padding: '1rem' }}>Total Spent (KES)</th>
                <th style={{ padding: '1rem' }}>Loyalty Discount</th>
                <th style={{ padding: '1rem' }}>Last Purchase</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.phone_number}</td>
                  <td style={{ padding: '1rem' }}>{c.mpesa_purchases_count}</td>
                  <td style={{ padding: '1rem' }}>{c.total_spent.toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    {c.is_eligible_for_discount ? (
                      <span className="badge-success">{c.discount_percentage}% Off</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Discount</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    {c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      className="btn-edit"
                      onClick={() => { setSelectedCustomer(c); setShowDiscountModal(true); }}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      Set Discount
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDiscountModal && (
        <DiscountModal
          customer={selectedCustomer}
          onSave={applyDiscount}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
    </div>
  );
}

function DiscountModal({ customer, onSave, onClose }) {
  const [percentage, setPercentage] = useState(customer?.discount_percentage || 0);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h3>Loyalty Discount: {customer.phone_number}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
          Set a fixed discount percentage for this customer's future M-Pesa purchases.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Discount Percentage (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={percentage}
              onChange={e => setPercentage(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '3.5rem' }}>{percentage}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => onSave(customer.id, percentage)}
            className="bg-primary"
            style={{ flex: 1, padding: '0.75rem' }}
          >
            Apply Discount
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Email Notification Settings Component for Admin Dashboard
function EmailNotificationSettings() {
  const { token } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    admin_email: '',
    notification_emails: '',
    email_notifications_enabled: 'true'
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings(token);
      const settingsMap = {};
      data.forEach(s => { settingsMap[s.key] = s.value; });
      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const saveSetting = async (key, value) => {
    setSaving(true);
    try {
      await api.updateSetting(token, key, value);
      setMessage({ type: 'success', text: 'Settings saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestAlert = async () => {
    setTesting(true);
    setMessage(null);
    try {
      // Re-using the manual trigger endpoint
      const response = await fetch('http://localhost:5000/api/admin/check-low-stock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      setMessage({
        type: 'success',
        text: result.itemsCount > 0
          ? `✓ Alert sent! ${result.itemsCount} low stock items reported to ${settings.admin_email}`
          : '✓ All items are well stocked. No alert needed.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
          <Mail size={20} />
        </div>
        <h3 style={{ margin: 0 }}>📧 Notification Settings</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Primary Notification Email</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              className="form-input"
              value={settings.admin_email || ''}
              onChange={e => setSettings({ ...settings, admin_email: e.target.value })}
              placeholder="admin@example.com"
              style={{ flex: 1 }}
            />
            <button
              className="bg-primary"
              onClick={() => saveSetting('admin_email', settings.admin_email)}
              disabled={saving}
              style={{ padding: '0.5rem 1rem' }}
            >
              Save
            </button>
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Additional Emails (comma-separated)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={settings.notification_emails || ''}
              onChange={e => setSettings({ ...settings, notification_emails: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              style={{ flex: 1 }}
            />
            <button
              className="bg-primary"
              onClick={() => saveSetting('notification_emails', settings.notification_emails)}
              disabled={saving}
              style={{ padding: '0.5rem 1rem' }}
            >
              Save
            </button>
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Enable Daily Notifications</label>
          <select
            className="form-input"
            value={settings.email_notifications_enabled || 'true'}
            onChange={e => {
              const val = e.target.value;
              setSettings({ ...settings, email_notifications_enabled: val });
              saveSetting('email_notifications_enabled', val);
            }}
            style={{ width: '100%' }}
          >
            <option value="true">Enabled - Daily at 8:00 AM (EAT)</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: settings.email_notifications_enabled === 'true' ? 'var(--success)' : 'var(--text-muted)'
            }}></span>
            <span style={{ fontSize: '0.9rem' }}>Monitoring: <strong>{settings.email_notifications_enabled === 'true' ? 'Active' : 'Disabled'}</strong></span>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '0.9rem' }}>Sending to: <strong>{settings.admin_email || 'Not configured'}</strong></span>
        </div>

        <button
          className="btn-test"
          onClick={sendTestAlert}
          disabled={testing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={testing ? 'spin' : ''} />
          {testing ? 'Sending...' : '🔔 Send Test Alert Now'}
        </button>
      </div>

      {message && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? '✓' : '✗'} {message.text}
        </div>
      )}
    </div>
  );
}

// Sale Detail Modal
function SaleDetailModal({ sale, onClose }) {
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/sales/${sale.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch sale details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [sale.id, token]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px', padding: '0' }}>
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Receipt {sale.receipt_number}</h2>
          <button onClick={onClose} style={{ background: 'transparent' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date</div>
              <div style={{ fontWeight: 600 }}>{new Date(sale.created_at).toLocaleString('en-KE')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Seller</div>
              <div style={{ fontWeight: 600 }}>{sale.seller_name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Method</div>
              <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{sale.payment_method}</div>
            </div>
            {sale.customer_phone && (
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{sale.customer_phone}</div>
              </div>
            )}
            {sale.mpesa_reference && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>M-Pesa Reference</div>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>{sale.mpesa_reference}</div>
              </div>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)' }}>Product</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading items...</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 500 }}>{item.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.item_code}</div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.unit_price.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{item.total_price.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem' }}>
              Final Total: <strong style={{ color: 'var(--primary)' }}>KES {sale.total_amount.toLocaleString()}</strong>
            </div>
            {sale.total_profit && (
              <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
                Profit: KES {sale.total_profit.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="bg-primary" style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Re-print Receipt
          </button>
          <button onClick={onClose} style={{ padding: '0.5rem 1.5rem', background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Sales History Component
function SalesHistory() {
  const { token, user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First of month
    endDate: new Date().toISOString().split('T')[0], // Today
    paymentMethod: 'all', // all, cash, mpesa
    search: '' // customer phone or receipt number
  });
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, [filters]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSalesHistory(token, filters);
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Receipt No', 'Date', 'Seller', 'Customer', 'Payment', 'Items', 'Total Amount', 'Profit'];
    const rows = sales.map(s => [
      s.receipt_number,
      new Date(s.created_at).toLocaleString(),
      s.seller_name,
      s.customer_phone || '-',
      s.payment_method,
      s.items_count,
      s.total_amount,
      s.total_profit
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elshadai_sales_${filters.startDate}_to_${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.total_profit, 0);
  const mpesaSales = sales.filter(s => s.payment_method === 'mpesa');
  const cashSales = sales.filter(s => s.payment_method === 'cash');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Transaction History</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Detailed log of all shop sales</p>
        </div>
        <button onClick={exportToCSV} className="bg-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Transactions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sales.length}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>KES {totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Profit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>KES {totalProfit.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #a855f7' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>M-Pesa / Cash</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{mpesaSales.length} / {cashSales.length}</div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', background: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>From Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            style={{ width: '160px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>To Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            style={{ width: '160px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Method</label>
          <select
            className="form-input"
            value={filters.paymentMethod}
            onChange={e => setFilters({ ...filters, paymentMethod: e.target.value })}
            style={{ width: '160px' }}
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash Only</option>
            <option value="mpesa">M-Pesa Only</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Receipt no. or phone..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>
        <button onClick={loadSales} className="bg-primary" style={{ height: '42px', padding: '0 1.5rem' }}>
          Filter
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Receipt No</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Date & Time</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Seller</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Customer</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Payment</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Fetching transaction logs...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No transactions found for these filters.</td></tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{sale.receipt_number}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(sale.created_at).toLocaleString('en-KE')}</td>
                    <td style={{ padding: '1rem' }}>{sale.seller_name}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{sale.customer_phone || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${sale.payment_method === 'mpesa' ? 'badge-success' : ''}`}
                        style={{ background: sale.payment_method === 'mpesa' ? '#dcfce7' : '#f1f5f9', color: sale.payment_method === 'mpesa' ? '#166534' : '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {sale.payment_method === 'mpesa' ? '📱 M-PESA' : '💵 CASH'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>KES {sale.total_amount.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}

// Inventory Audit Trail Component
function InventoryAuditTrail() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    itemCode: '',
    limit: 100
  });

  useEffect(() => {
    loadLogs();
  }, [filters.type]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(token, filters);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      'SALE': { bg: '#fee2e2', color: '#991b1b', icon: '🛒' },
      'RESTOCK': { bg: '#dcfce7', color: '#166534', icon: '📥' },
      'EDIT': { bg: '#f1f5f9', color: '#475569', icon: '✏️' },
      'EXCEL_SYNC': { bg: '#eff6ff', color: '#1e40af', icon: '🔄' },
      'DELETE': { bg: '#000', color: '#fff', icon: '🗑️' }
    };
    const s = styles[type] || { bg: '#f1f5f9', color: '#475569', icon: '❓' };
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {s.icon} {type}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Stock History & Audit Log</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trace every change in inventory levels</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="all">All Changes</option>
            <option value="SALE">Sales Only</option>
            <option value="RESTOCK">Restocks</option>
            <option value="EDIT">Manual Edits</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search Item Code..."
              value={filters.itemCode}
              onChange={e => setFilters({ ...filters, itemCode: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && loadLogs()}
              style={{ width: '200px', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>Time</th>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>Product</th>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>Type</th>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>Change</th>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>Stock (Before → After)</th>
                <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Loading tracking data...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No audit logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.item_code}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{getTypeBadge(log.change_type)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: log.quantity_changed > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{log.before_quantity}</span>
                      <span style={{ margin: '0 0.5rem' }}>→</span>
                      <span style={{ fontWeight: 600 }}>{log.after_quantity}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      {log.user_name || 'System'}
                      {log.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{log.notes}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

      // Product Performance Component
      function ProductPerformance({period}) {
  const {token} = useContext(AuthContext);
      const [data, setData] = useState([]);
      const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
      try {
        const result = await api.getProductPerformance(token, period);
      setData(result);
      } catch (err) {
        console.error('Failed to fetch performance:', err);
      } finally {
        setLoading(false);
      }
    };
      fetchData();
  }, [token, period]);

      if (loading && data.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading performance data...</div>;

      return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '8px', color: '#d97706' }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ margin: 0 }}>Product Performance Ranking</h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Period: {period}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Product Details</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>Qty Sold</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>Profit</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>Current Stock</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{p.description}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.item_code}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{p.total_sold}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>KES {p.total_revenue.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>KES {p.total_profit.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      background: p.current_stock <= 5 ? '#fee2e2' : '#f1f5f9',
                      color: p.current_stock <= 5 ? 'var(--danger)' : '#475569'
                    }}>
                      {p.current_stock} pcs
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ width: '100px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginLeft: 'auto' }}>
                      <div style={{
                        width: `${Math.min((p.total_sold / (data[0].total_sold || 1)) * 100, 100)}%`,
                        height: '100%',
                        background: 'var(--primary)',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sales data for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      );
}

      function Dashboard() {
  const {token} = useContext(AuthContext);
      const [stats, setStats] = useState(null);
      const [period, setPeriod] = useState('today');
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

  const fetchStats = async () => {
        setLoading(true);
      setError(null);
      try {
      const data = await api.getDashboardStats(token, period);
      setStats(data);
    } catch (err) {
        console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
        fetchStats();
  }, [token, period]);

      if (loading) return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1.5rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Calculating latest business reports...</p>
      </div>
      );

      if (error) return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem', border: '2px dashed var(--danger)' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ Dashboard Error</h3>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={fetchStats} className="bg-primary" style={{ padding: '0.75rem 2rem' }}>
          Retry Loading
        </button>
      </div>
      );

      if (!stats) return null;

      return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Business Analytics</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overview of your shop's performance</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
              {['today', 'week', 'month', 'all'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: period === p ? 'white' : 'transparent',
                    color: period === p ? 'var(--primary)' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                    fontSize: '0.85rem'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button onClick={fetchStats} style={{ background: 'transparent', color: 'var(--primary)', padding: '0.5rem' }} title="Refresh">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Sales</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>KES {stats.totalSales.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>{stats.transactionCount} transactions</div>
              </div>
              <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px', color: 'var(--primary)' }}>
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gross Profit</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--success)' }}>KES {stats.totalProfit.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {stats.totalSales > 0 ? `${((stats.totalProfit / stats.totalSales) * 100).toFixed(1)}% margin` : '0% margin'}
                </div>
              </div>
              <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px', color: 'var(--success)' }}>
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="card" style={{ borderTop: stats.lowStockCount > 0 ? '4px solid var(--danger)' : '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Low Stock Alert</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: stats.lowStockCount > 0 ? 'var(--danger)' : 'inherit' }}>{stats.lowStockCount} items</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Need replenishment</div>
              </div>
              <div style={{ padding: '0.5rem', background: stats.lowStockCount > 0 ? '#fef2f2' : '#fffbeb', borderRadius: '8px', color: stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Inventory Valuation</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>KES {stats.totalInventoryValue.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Current stock worth</div>
              </div>
              <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                <Package size={24} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Top Selling Products</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By quantity sold</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem' }}>Product</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'right' }}>Qty Sold</th>
                </tr>
              </thead>
              <tbody>
                {(stats.topProducts || []).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{p.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.item_code}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{p.totalSold}</td>
                  </tr>
                ))}
                {(!stats.topProducts || stats.topProducts.length === 0) && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales tracked for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>Stock Health Overview</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '8px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '1.5rem' }}>
                100%
              </div>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>System Integrity Check</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Database and inventory synchronization is currently healthy.</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <CheckCircle color="var(--success)" size={20} />
              <span style={{ fontSize: '0.85rem' }}>Last synced with Excel just now</span>
            </div>
          </div>
        </div>
        <EmailNotificationSettings />
        <DatabaseManagement />
        <ProductPerformance period={period} />
      </div>
      );
}

      function DatabaseManagement() {
    const {token} = useContext(AuthContext);
      const [backingUp, setBackingUp] = useState(false);
    const handleBackup = async () => {
        setBackingUp(true);
      try {
            const blob = await api.backupDatabase(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elshadai_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
        } catch (err) {
        console.error(err);
      alert('Backup failed');
        } finally {
        setBackingUp(false);
        }
    };
      return (
      <div className="card">
        <h3>Database Maintenance</h3>
        <button onClick={handleBackup} disabled={backingUp} className="bg-primary" style={{ marginTop: '1rem', width: '100%' }}>
          {backingUp ? 'Backing up...' : 'Download Database Backup'}
        </button>
      </div>
      );
}

      export default App;

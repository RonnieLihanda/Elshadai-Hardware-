import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import api from './api';
import { ShoppingCart, LayoutDashboard, Package, LogOut, Search, Plus, Minus, X, Printer, CheckCircle, Users, Edit, Trash2 } from 'lucide-react';

// Simplified Auth Context
const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('pos'); // pos, dashboard, inventory, users
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
          {view === 'users' && <UserManagement />}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

// Login Component
function Login({ onLogin, error, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="modal-overlay" style={{ background: 'var(--primary)' }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Elshadai POS</h2>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          <button className="bg-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
          Elshadai Hardware • Musembe, Eldoret
        </div>
      </div>
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
            <button onClick={() => setView('users')} style={{ background: 'transparent', color: activeView === 'users' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Users
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

  const total = cart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    return sum + (price * item.quantity);
  }, 0);

  const totalSavings = cart.reduce((sum, item) => {
    if (item.quantity >= (item.discount_threshold || 7)) {
      return sum + ((item.regular_price - item.discount_price) * item.quantity);
    }
    return sum;
  }, 0);

  const totalProfit = cart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    return sum + ((price - item.buying_price) * item.quantity);
  }, 0);

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
        total_profit: totalProfit
      };

      console.log('Sending request to: http://localhost:5000/api/sales');
      console.log('Sale Data:', saleData);

      const result = await api.createSale(saleData, token);
      console.log('Sale successful:', result);

      setReceipt({
        ...result,
        items: saleItems,
        total_amount: total,
        total_savings: totalSavings,
        seller: user.fullName
      });
      setCart([]);
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
        errorMessage += err.message;
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
              <span>Discount Savings</span>
              <span>- KES {totalSavings.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
          <button
            className="bg-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={cart.length === 0 || completing}
            onClick={completeSale}
          >
            {completing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

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
            <div>Date: {new Date().toLocaleString()}</div>
            <div>Seller: {receipt.seller}</div>
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
                const isDiscounted = item.quantity >= (item.discount_threshold || 7);
                const savings = isDiscounted ? (item.regular_price - item.discount_price) * item.quantity : 0;
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td style={{ textAlign: 'left' }}>{item.description.substring(0, 18)}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{item.total_price.toLocaleString()}{isDiscounted ? '*' : ''}</td>
                    </tr>
                    {isDiscounted && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'left', fontSize: '0.7rem', paddingLeft: '0.5rem' }}>
                          (Bulk discount applied - Saved KES {savings.toLocaleString()})
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>SUBTOTAL</span>
            <span>KES {(receipt.total_amount + (receipt.total_savings || 0)).toLocaleString()}</span>
          </div>
          {receipt.total_savings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'black' }}>
              <span>DISCOUNT SAVINGS</span>
              <span>KES {receipt.total_savings.toLocaleString()}</span>
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

// User Management Component
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

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = () => {
    api.getAllProducts(token).then(setProducts);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id, token);
        alert('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportInventory(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Inventory Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-add" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add New Product
          </button>
          <button className="bg-primary" onClick={handleExport} disabled={exporting} style={{ padding: '0.5rem 1rem' }}>
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>
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
          {products.map(p => (
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
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Low Stock Alert</label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Buying (KES)</label>
              <input
                type="number"
                value={formData.buying_price}
                onChange={e => setFormData({ ...formData, buying_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Regular (KES)</label>
              <input
                type="number"
                value={formData.regular_price}
                onChange={e => setFormData({ ...formData, regular_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Discount (KES)</label>
              <input
                type="number"
                value={formData.discount_price}
                onChange={e => setFormData({ ...formData, discount_price: parseFloat(e.target.value) })}
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

function Dashboard() {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    api.getDashboardStats(token, period).then(setStats);
  }, [token, period]);

  if (!stats) return <div>Loading reports...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Business Analytics</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
          {['today', 'week', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                background: period === p ? 'white' : 'transparent',
                color: period === p ? 'var(--primary)' : 'var(--text-muted)',
                textTransform: 'capitalize'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Sales</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>KES {(stats.totalSales || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Profit</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>KES {(stats.totalProfit || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Transactions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.transactionCount}</div>
        </div>
        <div className="card" style={{ borderLeft: stats.lowStockCount > 0 ? '4px solid var(--danger)' : 'none' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Low Stock Items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.lowStockCount > 0 ? 'var(--danger)' : 'inherit' }}>{stats.lowStockCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3>Top Selling Products</h3>
          <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.5rem' }}>Product</th>
                <th style={{ padding: '0.5rem' }}>Sold</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topProducts || []).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem' }}>{p.description}</td>
                  <td style={{ padding: '0.5rem' }}>{p.totalSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Total Inventory Value</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>KES {(stats.totalInventoryValue || 0).toLocaleString()}</div>
            <CheckCircle color="var(--success)" size={48} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

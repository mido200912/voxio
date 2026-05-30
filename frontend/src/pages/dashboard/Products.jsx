import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './DashboardShared.css';
import './Products.css';

const EMPTY_FORM = { name: '', description: '', price: 0, currency: 'USD', category: '', sku: '', inventory: 0, platforms: [], images: [] };

const PLATFORMS = [
  { id: 'shopify', label: 'Shopify', icon: '🛍️' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'website', label: 'Website', icon: '🌐' },
  { id: 'widget', label: 'Widget', icon: '🔌' },
];

const Products = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const { toast } = useToast();
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = secureStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/products`, { headers });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setImageUrl('');
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? 0,
      currency: product.currency || 'USD',
      category: product.category || '',
      sku: product.sku || '',
      inventory: product.inventory ?? 0,
      platforms: product.platforms || [],
      images: product.images || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast(isArabic ? 'اسم المنتج مطلوب' : 'Product name is required', 'error'); return; }
    try {
      if (editingId) {
        await axios.put(`${BACKEND_URL}/products/${editingId}`, form, { headers });
        toast(isArabic ? 'تم تحديث المنتج' : 'Product updated', 'success');
      } else {
        await axios.post(`${BACKEND_URL}/products`, form, { headers });
        toast(isArabic ? 'تم إضافة المنتج' : 'Product added', 'success');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.error || 'Error saving product', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isArabic ? 'حذف هذا المنتج؟' : 'Delete this product?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/products/${id}`, { headers });
      toast(isArabic ? 'تم الحذف' : 'Deleted', 'success');
      fetchProducts();
    } catch (err) {
      toast('Error deleting', 'error');
    }
  };

  const addImage = () => {
    if (imageUrl.trim() && !form.images.includes(imageUrl.trim())) {
      setForm(prev => ({ ...prev, images: [...prev.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/products/sync-from-integration/shopify`, {}, { headers });
      toast(res.data.message, 'success');
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.error || 'Sync failed', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const togglePlatform = (id) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id) ? prev.platforms.filter(x => x !== id) : [...prev.platforms, id]
    }));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="dashboard-page" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{isArabic ? 'المنتجات' : 'Products'}</h1>
        <div className="header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="search-box">
            <input
              type="text"
              placeholder={isArabic ? 'بحث...' : 'Search...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="dash-btn dash-btn-outline" onClick={handleSync} disabled={syncLoading}>
            {syncLoading ? '⏳' : '🛍️'} {isArabic ? 'مزامنة من شوبيفاي' : 'Sync Shopify'}
          </button>
          <button className="dash-btn dash-btn-primary" onClick={openAddForm}>
            + {isArabic ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="product-form-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <div className="product-form-card" onClick={e => e.stopPropagation()}>
              <div className="product-form-header">
                <h2>{editingId ? (isArabic ? 'تعديل المنتج' : 'Edit Product') : (isArabic ? 'منتج جديد' : 'New Product')}</h2>
                <button className="form-close" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="product-form-body">
                  <div className="form-row">
                    <div className="dash-input-group" style={{ flex: 2 }}>
                      <label className="dash-label">{isArabic ? 'اسم المنتج' : 'Name'} *</label>
                      <input className="dash-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="dash-input-group" style={{ flex: 1 }}>
                      <label className="dash-label">{isArabic ? 'السعر' : 'Price'}</label>
                      <input className="dash-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="dash-input-group" style={{ flex: 1 }}>
                      <label className="dash-label">{isArabic ? 'العملة' : 'Currency'}</label>
                      <select className="dash-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                        <option value="USD">🇺🇸 USD</option>
                        <option value="SAR">🇸🇦 SAR</option>
                        <option value="EGP">🇪🇬 EGP</option>
                        <option value="EUR">🇪🇺 EUR</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="dash-input-group">
                      <label className="dash-label">{isArabic ? 'التصنيف' : 'Category'}</label>
                      <input className="dash-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                    </div>
                    <div className="dash-input-group">
                      <label className="dash-label">SKU</label>
                      <input className="dash-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                    </div>
                    <div className="dash-input-group">
                      <label className="dash-label">{isArabic ? 'المخزون' : 'Stock'}</label>
                      <input className="dash-input" type="number" min="0" value={form.inventory} onChange={e => setForm({ ...form, inventory: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="dash-input-group">
                    <label className="dash-label">{isArabic ? 'الوصف' : 'Description'}</label>
                    <textarea className="dash-textarea" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="dash-input-group">
                    <label className="dash-label">{isArabic ? 'الصور' : 'Images'}</label>
                    <div className="image-url-row">
                      <input className="dash-input" placeholder={isArabic ? 'رابط الصورة...' : 'Image URL...'} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                      <button type="button" className="dash-btn dash-btn-outline" onClick={addImage}>{isArabic ? 'إضافة' : 'Add'}</button>
                    </div>
                    {form.images.length > 0 && (
                      <div className="image-previews">
                        {form.images.map((url, i) => (
                          <div key={i} className="image-preview">
                            <img src={url} alt="" onError={e => { e.target.style.display = 'none' }} />
                            <button type="button" className="image-remove" onClick={() => removeImage(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dash-input-group">
                    <label className="dash-label">{isArabic ? 'المنصات' : 'Platforms'}</label>
                    <div className="platform-toggles">
                      {PLATFORMS.map(p => (
                        <label key={p.id} className={`platform-toggle ${form.platforms.includes(p.id) ? 'active' : ''}`}>
                          <input type="checkbox" checked={form.platforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
                          {p.icon} {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="product-form-footer">
                  <button type="submit" className="dash-btn dash-btn-primary">{isArabic ? 'حفظ' : 'Save'}</button>
                  <button type="button" className="dash-btn dash-btn-outline" onClick={() => setShowForm(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredProducts.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ color: 'var(--dash-text)', marginBottom: 8 }}>
            {search ? (isArabic ? 'لا توجد نتائج' : 'No results') : (isArabic ? 'لا توجد منتجات' : 'No products')}
          </h3>
          <p style={{ color: 'var(--dash-text-sec)' }}>
            {search ? (isArabic ? 'حاول تغيير البحث' : 'Try a different search') : (isArabic ? 'أضف منتجاً أو قم بالمزامنة من شوبيفاي' : 'Add a product or sync from Shopify')}
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="product-card-dash"
            >
              <div className="product-card-image">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class=\'product-img-placeholder\'>📦</div>'; }} />
                ) : (
                  <div className="product-img-placeholder">📦</div>
                )}
                <div className="product-card-platforms">
                  {(p.platforms || []).map(pl => <span key={pl} className="plat-badge">{pl}</span>)}
                </div>
              </div>
              <div className="product-card-body">
                <h3 className="product-card-name">{p.name}</h3>
                <div className="product-card-price">{p.price} {p.currency}</div>
                {p.description && <p className="product-card-desc">{p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}</p>}
                <div className="product-card-meta">
                  <span className={`dash-badge ${p.isActive ? 'dash-badge-success' : ''}`}>
                    {p.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                  </span>
                  {p.sku && <span className="dash-badge">SKU: {p.sku}</span>}
                  {p.inventory > 0 && <span className="dash-badge">{isArabic ? 'مخزون' : 'Stock'}: {p.inventory}</span>}
                </div>
              </div>
              <div className="product-card-actions">
                <button className="dash-btn dash-btn-outline" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => openEditForm(p)}>
                  ✏️
                </button>
                <button className="dash-btn dash-btn-outline" style={{ padding: '8px 16px', fontSize: 13, color: '#ef4444', borderColor: '#ef444430' }} onClick={() => handleDelete(p._id)}>
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;

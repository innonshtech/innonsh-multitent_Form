'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Search, 
  Plus, 
  X, 
  Info,
  Package,
  DollarSign,
  Tag,
  CheckCircle,
  FileText,
  AlertTriangle,
  Archive,
  Trash2
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Search & filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Software');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');

  const [formError, setFormError] = useState('');

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  // Fetch current user and session details
  useEffect(() => {
    async function initProducts() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }
      } catch (err) {
        console.error('Fetch current user details error:', err);
      }
    }
    initProducts();
  }, []);

  // Fetch products catalogue
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Fetch products failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter]);

  // Handle Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const productData = {
      name: name.trim(),
      sku: sku.toUpperCase().trim(),
      price: Number(price) || 0,
      category,
      description: description.trim(),
      status
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetForm();
        fetchProducts();
        showToast('📦 Product successfully registered in catalog!');
      } else {
        setFormError(data.error || 'Failed to add product.');
      }
    } catch (err) {
      setFormError('Network link failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently from the catalogue?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        showToast('🗑️ Product deleted from catalogue.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setCategory('Software');
    setDescription('');
    setStatus('Active');
    setFormError('');
  };

  const isEditable = currentUser?.role === 'owner' || currentUser?.role === 'sales_admin';

  // Analytics Metrics Counters
  const totalProducts = products.length;
  const softwareCount = products.filter(p => p.category === 'Software').length;
  const hardwareCount = products.filter(p => p.category === 'Hardware').length;
  const servicesCount = products.filter(p => p.category === 'Services').length;

  return (
    <div className="space-y-6 relative h-full">
      
      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {toastMessage.text && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-300 bg-emerald-50 border-emerald-250 text-emerald-800">
          <Info className="h-4.5 w-4.5" />
          <span className="text-xs font-black tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* --- HEADER PANELS --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7 text-emerald-500" />
            Pricing {currentUser?.sectorConfig?.productTerm || 'Product'}s Catalogue
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage company pricing models, active license SKUs, consulting services, and base costs.
          </p>
        </div>
        {isEditable && (
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => { resetForm(); setAddModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5 stroke-[3]" />
              Add Catalog {currentUser?.sectorConfig?.productTerm || 'Product'}
            </button>
          </div>
        )}
      </div>

      {/* --- INVENTORY METRICS SUMMARY CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-350">
        {/* Total catalog items */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total {currentUser?.sectorConfig?.productTerm || 'Product'}s SKU</span>
            <span className="text-2xl font-black text-slate-800 block mt-1">{totalProducts}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* Software licensing */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Software Licences</span>
            <span className="text-2xl font-black text-indigo-650 block mt-1">{softwareCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <Tag className="h-5 w-5" />
          </div>
        </div>

        {/* Services / Consultings */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Professional Services</span>
            <span className="text-2xl font-black text-emerald-600 block mt-1">{servicesCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Hardware / equipment */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Hardware Equipment</span>
            <span className="text-2xl font-black text-amber-600 block mt-1">{hardwareCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Archive className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* --- SEARCH AND FILTERS BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search SKU code or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
          />
        </div>

        {/* Category selector */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
          >
            <option value="">All Categories</option>
            <option value="Software">Software Products</option>
            <option value="Hardware">Hardware Spares</option>
            <option value="Services">Consulting & Services</option>
          </select>
        </div>

        {/* Status selector */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
          >
            <option value="">All Catalog Status</option>
            <option value="Active">🟢 Active Selling</option>
            <option value="Inactive">⚪ Archived SKU</option>
          </select>
        </div>
      </div>

      {/* --- TABLE LAYOUT --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs text-slate-400 font-bold">Retrieving pricing catalogues index...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
              <Package className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No products added yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
              Add hardware rates, monthly license subscriptions, or consulting rates here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">{currentUser?.sectorConfig?.productTerm || 'Product'} details</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Base price (INR)</th>
                  <th className="px-6 py-4">Catalog Status</th>
                  {isEditable && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{product.name}</span>
                        {product.description && <span className="block text-[10px] text-slate-400 mt-1 italic">— {product.description}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-black uppercase border border-slate-150">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        product.category === 'Software' ? 'bg-indigo-50 text-indigo-705 border-indigo-100' :
                        product.category === 'Hardware' ? 'bg-amber-50 text-amber-705 border-amber-100' :
                        'bg-emerald-50 text-emerald-705 border-emerald-100'
                      }`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-xs">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase border ${
                        product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    {isEditable && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                          title="Delete Product SKU"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD CATALOG PRODUCT MODAL --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="h-5 w-5 text-emerald-500" />
                Register New Inventory {currentUser?.sectorConfig?.productTerm || 'Product'}
              </h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{currentUser?.sectorConfig?.productTerm || 'Product'} Name *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Premium CRM Monthly License"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                />
              </div>

              {/* SKU & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. INN-CRM-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit Base Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 75000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{currentUser?.sectorConfig?.productTerm || 'Product'} Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                  >
                    <option value="Software">💻 Software Licensing</option>
                    <option value="Hardware">🔌 Hardware & Equipment</option>
                    <option value="Services">🛠️ Professional Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catalogue Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                  >
                    <option value="Active">🟢 Active Selling</option>
                    <option value="Inactive">⚪ Inactive SKU</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Description / Features</label>
                <textarea
                  rows="3"
                  placeholder="Provide technical inventory details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                ></textarea>
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Register SKU Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

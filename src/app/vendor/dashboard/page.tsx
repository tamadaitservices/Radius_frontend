'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Store, Package, Star, Bell, LogOut, Menu, X,
  ChevronRight, Loader2, Save, Plus, Trash2, Pencil, ImagePlus,
  ToggleLeft, ToggleRight, CheckCircle, XCircle, User, Lock,
  Eye, EyeOff, ExternalLink, ShoppingBag, Sun, Moon
} from 'lucide-react';
import { actionErrorMessage } from '@/lib/api';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Section = 'dashboard' | 'shop' | 'products' | 'reservations' | 'reviews' | 'profile';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [{ id: 'dashboard' as Section, label: 'Dashboard', icon: <LayoutDashboard size={18} /> }],
  },
  {
    title: 'MY STORE',
    items: [
      { id: 'shop' as Section, label: 'My Shop', icon: <Store size={18} /> },
      { id: 'products' as Section, label: 'Products', icon: <Package size={18} /> },
    ],
  },
  {
    title: 'CUSTOMERS',
    items: [
      { id: 'reservations' as Section, label: 'Reservations', icon: <Bell size={18} /> },
      { id: 'reviews' as Section, label: 'Reviews', icon: <Star size={18} /> },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [{ id: 'profile' as Section, label: 'Profile', icon: <User size={18} /> }],
  },
];

const CATEGORY_LIST = ['ELECTRONICS','CLOTHING','GROCERY','HARDWARE','MEDICAL','FOOD','BAKERY','FURNITURE','SPORTS','BOOKS','BEAUTY','JEWELLERY','TOYS','AUTO','OTHER'];
const CATEGORY_LABELS: Record<string, string> = { ELECTRONICS:'Electronics', CLOTHING:'Clothing', GROCERY:'Grocery', HARDWARE:'Hardware', MEDICAL:'Medical', FOOD:'Food', BAKERY:'Bakery', FURNITURE:'Furniture', SPORTS:'Sports', BOOKS:'Books', BEAUTY:'Beauty', JEWELLERY:'Jewellery', TOYS:'Toys', AUTO:'Auto', OTHER:'Other' };

export default function VendorDashboard() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resFilter, setResFilter] = useState<string>('ALL');
  const [panelDark, setPanelDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ry-vendor-panel-theme') === 'dark';
  });
  const togglePanelTheme = () => setPanelDark(v => {
    const next = !v;
    localStorage.setItem('ry-vendor-panel-theme', next ? 'dark' : 'light');
    return next;
  });

  // Shop edit form
  const [shopForm, setShopForm] = useState({ name:'', description:'', category:'GROCERY', address:'', area:'', phone:'', whatsapp:'', openingTime:'09:00', closingTime:'21:00' });
  const [shopEditing, setShopEditing] = useState(false);
  const shopImageRef = useRef<HTMLInputElement | null>(null);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name:'', description:'', price:'', mrp:'', tags:'' });
  const productImageRef = useRef<Record<string, HTMLInputElement | null>>({});
  const newProductImageRef = useRef<HTMLInputElement | null>(null);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    if (!user) router.push('/vendor/login');
    else if (user.role !== 'VENDOR') router.push('/');
  }, [user]);

  // Pusher real-time reservation notifications
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!key || !user?.id) return;

    let channel: any;
    import('pusher-js').then(({ default: Pusher }) => {
      const pusher = new Pusher(key, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      });
      channel = pusher.subscribe(`vendor-${user.id}`);
      channel.bind('new-reservation', (data: { customerName: string; productName: string; shopName: string }) => {
        toast.success(
          `New reservation!\n${data.customerName} wants "${data.productName}" from ${data.shopName}`,
          { duration: 6000, icon: '🛎️' }
        );
        qc.invalidateQueries({ queryKey: ['vendor-reservations'] });
        qc.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      });
    });

    return () => { channel?.unbind_all(); channel?.unsubscribe(); };
  }, [user?.id]);

  if (!user || user.role !== 'VENDOR') return null;

  // ── Queries ──────────────────────────────────────────────────────

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: async () => { const r = await api.get('/api/vendor/dashboard'); return r.data; },
    enabled: !!user && user.role === 'VENDOR',
    refetchInterval: 60000,
  });

  const { data: reservations, isLoading: resLoading } = useQuery({
    queryKey: ['vendor-reservations'],
    queryFn: async () => { const r = await api.get('/api/reservations/vendor/incoming'); return r.data; },
    enabled: section === 'reservations' || section === 'dashboard',
    refetchInterval: 30000,
  });

  const shopId = dashboard?.shops?.[0]?.id;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', shopId],
    queryFn: async () => { const r = await api.get(`/api/vendor/products/${shopId}`); return r.data; },
    enabled: section === 'products' && !!shopId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['vendor-reviews'],
    queryFn: async () => { const r = await api.get('/api/vendor/reviews'); return r.data; },
    enabled: section === 'reviews' && !!user,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: async () => { const r = await api.get('/api/vendor/profile'); return r.data; },
    enabled: section === 'profile' && !!user,
  });

  // ── Mutations ────────────────────────────────────────────────────

  const toggleShop = useMutation({
    mutationFn: async ({ shopId, isOpen }: { shopId: string; isOpen: boolean }) =>
      api.patch(`/api/shops/${shopId}/status`, { isOpen }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-dashboard'] }); },
  });

  const updateShop = useMutation({
    mutationFn: async () => api.patch(`/api/vendor/shops/${shopId}`, shopForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      setShopEditing(false);
      toast.success('Shop updated.');
    },
    onError: (e: any) => toast.error(actionErrorMessage(e, 'Update failed.')),
  });

  const uploadShopImage = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData(); fd.append('image', file);
      await api.post(`/api/vendor/shops/${shopId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-dashboard'] }); toast.success('Cover image updated.'); },
    onError: (e: any) => toast.error(actionErrorMessage(e, 'Upload failed.')),
  });

  const respondReservation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/reservations/${id}/respond`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-reservations'] });
      qc.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      toast.success('Status updated.');
    },
    onError: (e: any) => toast.error(actionErrorMessage(e)),
  });

  const uploadGalleryImage = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData(); fd.append('image', file);
      const r = await api.post(`/api/vendor/shops/${shopId}/gallery`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-dashboard'] }); toast.success('Gallery image added.'); },
    onError: (e: any) => toast.error(actionErrorMessage(e, 'Upload failed.')),
  });

  const deleteGalleryImage = useMutation({
    mutationFn: async (url: string) => api.delete(`/api/vendor/shops/${shopId}/gallery`, { data: { url } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-dashboard'] }); toast.success('Image removed.'); },
    onError: (e: any) => toast.error(actionErrorMessage(e, 'Remove failed.')),
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/vendor/products', {
        shopId,
        name: productForm.name,
        description: productForm.description || undefined,
        price: parseFloat(productForm.price),
        mrp: productForm.mrp ? parseFloat(productForm.mrp) : undefined,
        tags: productForm.tags || undefined,
      });
      if (newProductImageFile) {
        const fd = new FormData(); fd.append('image', newProductImageFile);
        await api.post(`/api/vendor/products/${res.data.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', shopId] });
      setShowProductForm(false);
      setProductForm({ name:'', description:'', price:'', mrp:'', tags:'' });
      setNewProductImageFile(null); setNewProductImagePreview(null);
      toast.success('Product added!');
    },
    onError: (e: any) => toast.error(actionErrorMessage(e)),
  });

  const updateProduct = useMutation({
    mutationFn: async () => api.patch(`/api/vendor/products/${editingProduct.id}`, {
      name: productForm.name,
      description: productForm.description || undefined,
      price: parseFloat(productForm.price),
      mrp: productForm.mrp ? parseFloat(productForm.mrp) : undefined,
      tags: productForm.tags || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', shopId] });
      setEditingProduct(null);
      setShowProductForm(false);
      toast.success('Product updated.');
    },
    onError: (e: any) => toast.error(actionErrorMessage(e)),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/vendor/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-products', shopId] }); toast.success('Product deleted.'); },
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) =>
      api.patch(`/api/vendor/products/${id}/stock`, { inStock }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-products', shopId] }),
  });

  const uploadProductImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData(); fd.append('image', file);
      await api.post(`/api/vendor/products/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-products', shopId] }); toast.success('Image updated.'); },
  });

  const updateProfile = useMutation({
    mutationFn: async () => api.patch('/api/vendor/profile', { name: profileForm.name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-profile'] }); toast.success('Profile updated.'); },
    onError: (e: any) => toast.error(actionErrorMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: async () => api.post('/api/vendor/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully.');
    },
    onError: (e: any) => toast.error(actionErrorMessage(e)),
  });

  // ── Helpers ──────────────────────────────────────────────────────

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description ?? '', price: String(p.price), mrp: p.mrp ? String(p.mrp) : '', tags: p.tags?.join(', ') ?? '' });
    setShowProductForm(true);
  };

  const openShopEdit = () => {
    const s = dashboard?.shops?.[0];
    if (!s) return;
    setShopForm({ name: s.name, description: s.description ?? '', category: s.category, address: s.address, area: s.area, phone: s.phone, whatsapp: s.whatsapp ?? '', openingTime: s.openingTime, closingTime: s.closingTime });
    setShopEditing(true);
  };

  const handleLogout = () => { clearAuth(); router.push('/vendor/login'); };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <>
    <div className={`ry-panel${panelDark ? ' panel-dark' : ''} flex overflow-hidden`} style={{ height: '100dvh', background: panelDark ? '#0f172a' : '#f0f4f8' }}>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        style={{ width: '260px', background: '#0f3d2e', flexShrink: 0 }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: '#16a34a' }}>R</div>
          <div>
            <p className="text-white font-black text-base leading-none">RadiuYes</p>
            <p className="text-green-400 text-xs font-medium mt-0.5">Vendor Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-xs font-bold px-3 mb-2" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>{group.title}</p>
              {group.items.map((item) => {
                const active = section === item.id;
                const isPending = item.id === 'reservations' && (reservations ?? []).filter((r: any) => r.status === 'PENDING').length > 0;
                return (
                  <button key={item.id}
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-semibold transition-all"
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)', background: active ? 'rgba(255,255,255,0.12)' : 'transparent' }}>
                    <span style={{ color: active ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                    {item.label}
                    {isPending && (
                      <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {(reservations ?? []).filter((r: any) => r.status === 'PENDING').length}
                      </span>
                    )}
                    {active && !isPending && <ChevronRight size={14} className="ml-auto" style={{ color: '#4ade80' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10 space-y-1">
          {dashboard?.shops?.[0] && (
            <a href={`/shop/${dashboard.shops[0].slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <ExternalLink size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
              View My Shop
            </a>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            <LogOut size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="panel-header flex items-center gap-4 px-5 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900">{NAV_GROUPS.flatMap(g => g.items).find(i => i.id === section)?.label ?? 'Dashboard'}</h1>
            <p className="text-xs text-gray-400">RadiuYes Vendor · {user?.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Theme toggle */}
            <button onClick={togglePanelTheme} title={panelDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors">
              {panelDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {/* Shop open/close quick toggle */}
            {dashboard?.shops?.[0] && (
              <button
                onClick={() => toggleShop.mutate({ shopId: dashboard.shops[0].id, isOpen: !dashboard.shops[0].isOpen })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${dashboard.shops[0].isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {dashboard.shops[0].isOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {dashboard.shops[0].isOpen ? 'Open' : 'Closed'}
              </button>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#16a34a' }}>
              {user?.name?.[0] ?? 'V'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">

          {/* ── DASHBOARD ─────────────────────────────────────────── */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              {dashLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Products', value: dashboard?.shops?.[0]?._count?.products ?? 0, icon: <Package size={22} />, bg: '#10b981' },
                      { label: 'Total Reservations', value: dashboard?.totalReservations ?? 0, icon: <Bell size={22} />, bg: '#f59e0b' },
                      { label: 'Pending', value: dashboard?.pendingReservations ?? 0, icon: <ShoppingBag size={22} />, bg: '#ef4444' },
                      { label: 'Rating', value: `${(dashboard?.shops?.[0]?.rating ?? 0).toFixed(1)} ★`, icon: <Star size={22} />, bg: '#8b5cf6' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                            <p className="text-4xl font-black text-gray-900 mt-1">{s.value}</p>
                          </div>
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: s.bg }}>{s.icon}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shop status card + recent reservations */}
                  <div className="grid lg:grid-cols-2 gap-5">
                    {/* Shop card */}
                    {dashboard?.shops?.[0] && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-gray-900">My Shop</h2>
                          <button onClick={() => setSection('shop')} className="text-xs text-green-600 font-bold hover:underline">Edit →</button>
                        </div>
                        {/* Cover image */}
                        {dashboard.shops[0].coverImage && (
                          <div className="relative w-full h-28 rounded-xl overflow-hidden mb-3">
                            <Image src={dashboard.shops[0].coverImage} alt="cover" fill className="object-cover" sizes="400px" />
                          </div>
                        )}
                        <p className="font-bold text-gray-900">{dashboard.shops[0].name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{dashboard.shops[0].area} · {CATEGORY_LABELS[dashboard.shops[0].category]}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{dashboard.shops[0].openingTime} – {dashboard.shops[0].closingTime}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm text-gray-600 font-medium">Shop Status</span>
                          <button
                            onClick={() => toggleShop.mutate({ shopId: dashboard.shops[0].id, isOpen: !dashboard.shops[0].isOpen })}
                            className="flex items-center gap-2 font-semibold text-sm"
                            style={{ color: dashboard.shops[0].isOpen ? '#16a34a' : '#9ca3af' }}>
                            {dashboard.shops[0].isOpen ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            {dashboard.shops[0].isOpen ? 'Open' : 'Closed'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recent reservations */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                          <Bell size={16} className="text-orange-500" /> Recent Reservations
                        </h2>
                        <button onClick={() => setSection('reservations')} className="text-xs text-green-600 font-bold hover:underline">View all →</button>
                      </div>
                      {!(reservations?.length)
                        ? <p className="text-sm text-gray-400 text-center py-6">No reservations yet</p>
                        : <div className="space-y-2">
                            {(reservations ?? []).slice(0, 5).map((r: any) => (
                              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'PENDING' ? 'bg-amber-400' : r.status === 'ACCEPTED' ? 'bg-green-500' : r.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-red-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">{r.product?.name}</p>
                                  <p className="text-xs text-gray-400">{r.user?.name ?? r.user?.phone}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  </div>
                </>
              }
            </div>
          )}

          {/* ── MY SHOP ───────────────────────────────────────────── */}
          {section === 'shop' && (
            <div className="space-y-5 max-w-2xl">
              {dashLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : !dashboard?.shops?.[0]
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">No shop found. Contact admin.</div>
                  : (() => {
                      const shop = dashboard.shops[0];
                      return (
                        <div className="space-y-5">
                          {/* Cover image */}
                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4">Cover Image</h2>
                            <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ height: '160px', background: '#f3f4f6' }}>
                              {shop.coverImage
                                ? <Image src={shop.coverImage} alt="cover" fill className="object-cover" sizes="600px" />
                                : <div className="flex items-center justify-center h-full text-gray-400"><ImagePlus size={32} /></div>
                              }
                            </div>
                            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold cursor-pointer w-fit">
                              <ImagePlus size={16} /> {shop.coverImage ? 'Replace Image' : 'Upload Image'}
                              <input type="file" accept="image/*" className="sr-only" ref={shopImageRef}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadShopImage.mutate(f); e.target.value = ''; }} />
                            </label>
                            {uploadShopImage.isPending && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
                          </div>

                          {/* Shop details */}
                          {/* Gallery */}
                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h2 className="font-bold text-gray-900">Gallery</h2>
                              {(shop.images?.length ?? 0) < 8 && (
                                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer">
                                  <ImagePlus size={13} /> Add Photo
                                  <input type="file" accept="image/*" className="sr-only"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGalleryImage.mutate(f); e.target.value = ''; }} />
                                </label>
                              )}
                            </div>
                            {shop.images?.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {shop.images.map((url: string, i: number) => (
                                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100">
                                    <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="120px" />
                                    <button
                                      onClick={() => { if (confirm('Remove this image?')) deleteGalleryImage.mutate(url); }}
                                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 text-center py-4">No gallery images yet. Add up to 8 photos.</p>
                            )}
                          </div>

                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h2 className="font-bold text-gray-900">Shop Details</h2>
                              {!shopEditing
                                ? <button onClick={openShopEdit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-bold border border-blue-200">
                                    <Pencil size={14} /> Edit
                                  </button>
                                : <div className="flex gap-2">
                                    <button onClick={() => updateShop.mutate()} disabled={updateShop.isPending}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                                      {updateShop.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                                    </button>
                                    <button onClick={() => setShopEditing(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancel</button>
                                  </div>
                              }
                            </div>

                            {!shopEditing ? (
                              <div className="space-y-3">
                                {[
                                  { label: 'Shop Name', value: shop.name },
                                  { label: 'Category', value: CATEGORY_LABELS[shop.category] },
                                  { label: 'Description', value: shop.description || '—' },
                                  { label: 'Address', value: shop.address },
                                  { label: 'Area', value: shop.area },
                                  { label: 'Phone', value: shop.phone },
                                  { label: 'WhatsApp', value: shop.whatsapp || '—' },
                                  { label: 'Hours', value: `${shop.openingTime} – ${shop.closingTime}` },
                                ].map(f => (
                                  <div key={f.label} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
                                    <p className="text-sm text-gray-500 font-medium w-32 flex-shrink-0">{f.label}</p>
                                    <p className="text-sm text-gray-800 font-semibold">{f.value}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Shop Name</label>
                                    <input value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
                                    <select value={shopForm.category} onChange={e => setShopForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800">
                                      {CATEGORY_LIST.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Area</label>
                                    <input value={shopForm.area} onChange={e => setShopForm(f => ({ ...f, area: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                                    <textarea value={shopForm.description} onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 resize-none" />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Address</label>
                                    <input value={shopForm.address} onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
                                    <input value={shopForm.phone} onChange={e => setShopForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">WhatsApp</label>
                                    <input value={shopForm.whatsapp} onChange={e => setShopForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Opening Time</label>
                                    <input type="time" value={shopForm.openingTime} onChange={e => setShopForm(f => ({ ...f, openingTime: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Closing Time</label>
                                    <input type="time" value={shopForm.closingTime} onChange={e => setShopForm(f => ({ ...f, closingTime: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
              }
            </div>
          )}

          {/* ── PRODUCTS ──────────────────────────────────────────── */}
          {section === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{products?.length ?? 0} products</p>
                <button
                  onClick={() => { setEditingProduct(null); setProductForm({ name:'', description:'', price:'', mrp:'', tags:'' }); setNewProductImageFile(null); setNewProductImagePreview(null); setShowProductForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold">
                  <Plus size={15} /> Add Product
                </button>
              </div>

              {/* Product create/edit form */}
              {showProductForm && (
                <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>

                  {/* Image upload (create only) */}
                  {!editingProduct && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Product Image</label>
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-colors overflow-hidden" style={{ height: newProductImagePreview ? 'auto' : '80px' }}>
                        {newProductImagePreview
                          ? <div className="relative w-full" style={{ height: '160px' }}><Image src={newProductImagePreview} alt="preview" fill className="object-cover rounded-xl" sizes="400px" /></div>
                          : <div className="flex flex-col items-center gap-1 py-3 text-gray-400"><ImagePlus size={22} /><p className="text-xs font-medium">Click to upload</p></div>
                        }
                        <input type="file" accept="image/*" className="sr-only" ref={newProductImageRef}
                          onChange={e => { const f = e.target.files?.[0]; if (!f) return; setNewProductImageFile(f); setNewProductImagePreview(URL.createObjectURL(f)); }} />
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Product Name *</label>
                      <input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                      <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Price (₹) *</label>
                      <input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" min="0" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">MRP (₹) — original price</label>
                      <input type="number" value={productForm.mrp} onChange={e => setProductForm(f => ({ ...f, mrp: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" min="0" placeholder="Optional" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Tags (comma-separated)</label>
                      <input value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. organic, fresh, local" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editingProduct ? updateProduct.mutate() : createProduct.mutate()}
                      disabled={!productForm.name || !productForm.price || createProduct.isPending || updateProduct.isPending}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
                      {(createProduct.isPending || updateProduct.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {editingProduct ? 'Save Changes' : 'Add Product'}
                    </button>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              )}

              {/* Product list */}
              {productsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (products ?? []).length === 0
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No products yet. Add your first product.</div>
                  : <div className="space-y-3">
                      {(products ?? []).map((p: any) => (
                        <div key={p.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${!p.inStock ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-4">
                            {/* Product image */}
                            <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                              {p.image
                                ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" />
                                : <div className="flex items-center justify-center h-full text-gray-300"><Package size={20} /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900">{p.name}</p>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{p.sku}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {p.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm font-bold text-green-700">₹{p.price}</p>
                                {p.mrp && <p className="text-xs text-gray-400 line-through">₹{p.mrp}</p>}
                                {p.mrp && p.mrp > p.price && (
                                  <span className="text-xs font-bold text-amber-600">{Math.round((1 - p.price / p.mrp) * 100)}% off</span>
                                )}
                              </div>
                              {p.tags?.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{p.tags.join(' · ')}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Stock toggle */}
                              <button onClick={() => toggleStock.mutate({ id: p.id, inStock: !p.inStock })} title={p.inStock ? 'Mark out of stock' : 'Mark in stock'} className="p-2 hover:bg-gray-100 rounded-lg">
                                {p.inStock ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                              </button>
                              {/* Replace image */}
                              <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Replace image">
                                <ImagePlus size={16} />
                                <input type="file" accept="image/*" className="sr-only"
                                  ref={el => { productImageRef.current[p.id] = el; }}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadProductImage.mutate({ id: p.id, file: f }); e.target.value = ''; }} />
                              </label>
                              {/* Edit */}
                              <button onClick={() => openEditProduct(p)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"><Pencil size={15} /></button>
                              {/* Delete */}
                              <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
              }
            </div>
          )}

          {/* ── RESERVATIONS ──────────────────────────────────────── */}
          {section === 'reservations' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2">
                {['ALL','PENDING','ACCEPTED','DECLINED','COMPLETED'].map(s => (
                  <button key={s}
                    onClick={() => setResFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${resFilter === s
                      ? s === 'PENDING' ? 'bg-amber-500 text-white border-amber-500'
                      : s === 'ACCEPTED' ? 'bg-green-600 text-white border-green-600'
                      : s === 'DECLINED' ? 'bg-red-500 text-white border-red-500'
                      : s === 'COMPLETED' ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {s}
                  </button>
                ))}
                <span className="text-xs text-gray-400 self-center ml-1">
                  {(reservations ?? []).filter((r: any) => resFilter === 'ALL' || r.status === resFilter).length} results
                </span>
              </div>

              {resLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (reservations ?? []).filter((r: any) => resFilter === 'ALL' || r.status === resFilter).length === 0
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No reservations found.</div>
                  : <div className="space-y-3">
                      {(reservations ?? [])
                        .filter((r: any) => resFilter === 'ALL' || r.status === resFilter)
                        .map((r: any) => (
                          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: r.status === 'PENDING' ? '#f59e0b' : r.status === 'ACCEPTED' ? '#10b981' : r.status === 'COMPLETED' ? '#3b82f6' : '#ef4444' }}>
                                <ShoppingBag size={16} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-gray-900 text-sm">{r.product?.name}</p>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                    {r.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{r.user?.name ?? r.user?.phone} · {r.shop?.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                {/* Action buttons for PENDING */}
                                {r.status === 'PENDING' && (
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => respondReservation.mutate({ id: r.id, status: 'ACCEPTED' })}
                                      disabled={respondReservation.isPending}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200">
                                      <CheckCircle size={12} /> Accept
                                    </button>
                                    <button onClick={() => respondReservation.mutate({ id: r.id, status: 'DECLINED' })}
                                      disabled={respondReservation.isPending}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                                      <XCircle size={12} /> Decline
                                    </button>
                                  </div>
                                )}
                                {/* Mark completed for accepted */}
                                {r.status === 'ACCEPTED' && (
                                  <button onClick={() => respondReservation.mutate({ id: r.id, status: 'COMPLETED' })}
                                    disabled={respondReservation.isPending}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 mt-2">
                                    <CheckCircle size={12} /> Mark Completed
                                  </button>
                                )}
                              </div>
                              {r.agreedPrice && <p className="text-sm font-bold text-green-700 flex-shrink-0">₹{r.agreedPrice}</p>}
                            </div>
                          </div>
                        ))
                      }
                    </div>
              }
            </div>
          )}

          {/* ── REVIEWS ───────────────────────────────────────────── */}
          {section === 'reviews' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">{reviews?.length ?? 0} reviews</p>
              {reviewsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (reviews ?? []).length === 0
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No reviews yet.</div>
                  : (reviews ?? []).map((r: any) => (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: '#f59e0b' }}>
                            <Star size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-sm">{r.shop?.name}</p>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={`text-sm ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.user?.name ?? r.user?.phone}
                              {r.reservation?.product?.name && ` · ${r.reservation.product.name}`}
                            </p>
                            {r.comment && <p className="text-sm text-gray-700 mt-1.5 leading-snug">{r.comment}</p>}
                            <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
              }
            </div>
          )}

          {/* ── PROFILE ───────────────────────────────────────────── */}
          {section === 'profile' && (
            <div className="space-y-5 max-w-lg">
              {/* Profile info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={18} className="text-blue-500" /> Profile</h2>
                {profileLoading
                  ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-green-600" size={24} /></div>
                  : <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Phone Number</label>
                        <p className="text-sm font-bold text-gray-700 px-3 py-2.5 bg-gray-50 rounded-xl">+91 {profile?.phone}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                        <input value={profileForm.name || profile?.name || ''} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          onFocus={() => { if (!profileForm.name) setProfileForm(f => ({ ...f, name: profile?.name ?? '' })); }}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Plan</label>
                        <span className="inline-block text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">{profile?.plan ?? '—'}</span>
                      </div>
                      <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending || !profileForm.name}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
                        {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Profile
                      </button>
                    </div>
                }
              </div>

              {/* Change password */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} className="text-red-500" /> Change Password</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPass ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                        className="w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                      <button type="button" onClick={() => setShowCurrentPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">New Password</label>
                    <div className="relative">
                      <input type={showNewPass ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                        className="w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                      <button type="button" onClick={() => setShowNewPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Confirm New Password</label>
                    <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
                  </div>
                  <button
                    onClick={() => {
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
                      if (passwordForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
                      changePassword.mutate();
                    }}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || changePassword.isPending}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50">
                    {changePassword.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
    </>
  );
}

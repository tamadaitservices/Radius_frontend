'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Store, Users, ShoppingBag, Star, TrendingUp,
  ImagePlus, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle,
  Loader2, LogOut, ChevronRight, Menu, X, Search,
  MapPin, Megaphone, BookOpen, Globe, Plus, Pencil, Save, Package, Download, Upload, Sun, Moon, Settings, Eye, EyeOff,
  Bell, Send, UserCheck, Building2, UsersRound, Tag, Tags, Landmark, UtensilsCrossed
} from 'lucide-react';
import dynamic from 'next/dynamic';
import AdminModal from '@/components/admin/AdminModal';
import PlaceAdminSection from '@/components/admin/PlaceAdminSection';
import CategoryAdminSection from '@/components/admin/CategoryAdminSection';
import { useCategories } from '@/hooks/useCategories';

const ZoneMap = dynamic(() => import('@/components/admin/ZoneMap'), { ssr: false, loading: () => <div className="h-96 rounded-xl bg-gray-100 animate-pulse" /> });
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Section = 'dashboard' | 'vendors' | 'shops' | 'categories' | 'listings' | 'places' | 'food' | 'banners' | 'users' | 'reservations' | 'zones' | 'products' | 'reviews' | 'settings' | 'notifications';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
}

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard' as Section, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'CONTENT MANAGEMENT',
    items: [
      { id: 'banners' as Section, label: 'Banners', icon: <Megaphone size={18} /> },
    ],
  },
  {
    title: 'STORE MANAGEMENT',
    items: [
      { id: 'vendors' as Section, label: 'Vendors', icon: <Store size={18} /> },
      { id: 'shops' as Section, label: 'Shops', icon: <MapPin size={18} /> },
      { id: 'categories' as Section, label: 'Categories', icon: <Tags size={18} /> },
      { id: 'products' as Section, label: 'Products', icon: <Package size={18} /> },
      { id: 'listings' as Section, label: 'Listings', icon: <Tag size={18} /> },
      { id: 'places' as Section, label: 'Places', icon: <Landmark size={18} /> },
      { id: 'food' as Section, label: 'Food', icon: <UtensilsCrossed size={18} /> },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { id: 'users' as Section, label: 'Customers', icon: <Users size={18} /> },
      { id: 'reservations' as Section, label: 'Reservations', icon: <BookOpen size={18} /> },
      { id: 'reviews' as Section, label: 'Reviews', icon: <Star size={18} /> },
    ],
  },
  {
    title: 'ZONE MANAGEMENT',
    items: [
      { id: 'zones' as Section, label: 'Zones', icon: <Globe size={18} /> },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'notifications' as Section, label: 'Push Notifications', icon: <Bell size={18} /> },
      { id: 'settings' as Section, label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
];

const GRADIENTS = [
  { value: 'from-teal-600 to-emerald-500', label: 'Teal → Emerald' },
  { value: 'from-blue-600 to-cyan-500', label: 'Blue → Cyan' },
  { value: 'from-green-600 to-green-500', label: 'Forest Green' },
  { value: 'from-purple-600 to-violet-500', label: 'Purple → Violet' },
  { value: 'from-orange-500 to-amber-500', label: 'Orange → Amber' },
  { value: 'from-rose-600 to-pink-500', label: 'Rose → Pink' },
  { value: 'from-slate-700 to-slate-600', label: 'Dark Slate' },
  { value: 'from-indigo-600 to-blue-500', label: 'Indigo → Blue' },
];

export default function AdminPage() {
  const { user, hasHydrated, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelDark, setPanelDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ry-admin-panel-theme') === 'dark';
  });
  const togglePanelTheme = () => setPanelDark(v => {
    const next = !v;
    localStorage.setItem('ry-admin-panel-theme', next ? 'dark' : 'light');
    return next;
  });
  const [featuredDays, setFeaturedDays] = useState<Record<string, string>>({});
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', ctaText: '', ctaLink: '',
    gradient: 'from-teal-600 to-emerald-500', sortOrder: '0',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const newBannerFileRef = useRef<HTMLInputElement | null>(null);
  const bannerImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Constants
  const { categories: categoryRows, labels: CATEGORY_LABELS_MAP } = useCategories();
  const CATEGORY_LIST = categoryRows.map((c) => c.key);
  const PLANS = ['FREE','STARTER','PRO','BUSINESS'];

  // Zone form state
  const [zoneForm, setZoneForm] = useState({ name: '', categories: [] as string[], bannerIds: [] as string[], polygon: [] as { lat: number; lng: number }[] });

  // Edit modals state
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editBannerForm, setEditBannerForm] = useState({ title: '', subtitle: '', ctaText: '', ctaLink: '', gradient: '', sortOrder: '0' });
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [editVendorForm, setEditVendorForm] = useState({ name: '', shopName: '', plan: 'FREE' });
  const [editingShop, setEditingShop] = useState<any>(null);
  const [editShopForm, setEditShopForm] = useState({ name: '', description: '', address: '', area: '', phone: '', whatsapp: '', openingTime: '', closingTime: '', category: '', isOpen: true, lat: '', lng: '' });
  const [vendorSearch, setVendorSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ shopId: '', name: '', description: '', price: '', mrp: '', category: '', tags: '' });
  const [newProductSaved, setNewProductSaved] = useState<any>(null);
  const newProductPhotoRef = useRef<HTMLInputElement | null>(null);
  const [vendorShopsFilter, setVendorShopsFilter] = useState<string | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreviewUrl, setEditBannerPreviewUrl] = useState<string | null>(null);
  const editBannerFileRef = useRef<HTMLInputElement | null>(null);
  const shopImageRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editShopImageRef = useRef<HTMLInputElement | null>(null);
  const productImageRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const vendorShopImportFileRef = useRef<HTMLInputElement | null>(null);
  const [importingVendorsShops, setImportingVendorsShops] = useState(false);
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string; isSuspended: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [editingZone, setEditingZone] = useState<any>(null);
  const [editZoneForm, setEditZoneForm] = useState({ name: '', categories: [] as string[], bannerIds: [] as string[], polygon: [] as { lat: number; lng: number }[] });

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== 'ADMIN') router.push('/');
    if (!user) router.push('/admin/login');
  }, [user, hasHydrated]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const r = await api.get('/api/admin/stats'); return r.data; },
    enabled: user?.role === 'ADMIN',
    refetchInterval: 30000,
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => { const r = await api.get('/api/admin/vendors'); return r.data; },
    enabled: section === 'vendors' && user?.role === 'ADMIN',
  });

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: async () => { const r = await api.get('/api/admin/shops'); return r.data; },
    enabled: (section === 'shops' || section === 'products') && user?.role === 'ADMIN',
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => { const r = await api.get('/api/admin/listings'); return r.data; },
    enabled: section === 'listings' && user?.role === 'ADMIN',
  });

  const suspendListing = useMutation({
    mutationFn: async ({ id, suspended, reason }: { id: string; suspended: boolean; reason?: string }) =>
      api.patch(`/api/admin/listings/${id}/suspend`, { suspended, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-listings'] }),
    onError: () => toast.error('Failed to update listing.'),
  });

  const approveListing = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/admin/listings/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-listings'] }); toast.success('Listing approved — back live.'); },
    onError: () => toast.error('Failed to approve listing.'),
  });

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => { const r = await api.get('/api/admin/banners'); return r.data; },
    enabled: (section === 'banners' || section === 'zones') && user?.role === 'ADMIN',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => { const r = await api.get('/api/admin/users'); return r.data; },
    enabled: section === 'users' && user?.role === 'ADMIN',
  });

  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: async () => { const r = await api.get('/api/admin/reservations'); return r.data; },
    enabled: section === 'reservations' && user?.role === 'ADMIN',
  });

  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ['admin-zones'],
    queryFn: async () => { const r = await api.get('/api/zones/admin/all'); return r.data; },
    enabled: section === 'zones' && user?.role === 'ADMIN',
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products', productSearch, productCategory, productPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(productPage), limit: '50' });
      if (productSearch) params.set('search', productSearch);
      if (productCategory) params.set('category', productCategory);
      const r = await api.get(`/api/admin/products?${params}`);
      return r.data;
    },
    enabled: section === 'products' && user?.role === 'ADMIN',
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => { const r = await api.get('/api/admin/reviews'); return r.data; },
    enabled: section === 'reviews' && user?.role === 'ADMIN',
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => { const r = await api.get('/api/admin/settings'); return r.data.settings as Record<string, string>; },
    enabled: section === 'settings' && user?.role === 'ADMIN',
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsVisible, setSettingsVisible] = useState<Record<string, boolean>>({});
  const MASKED = '••••••••';

  // Notifications
  const [notifForm, setNotifForm] = useState({ title: '', body: '', target: 'all' });
  const [notifResult, setNotifResult] = useState<{ sentCount: number; failCount: number; totalTokens: number } | null>(null);

  const { data: notifLogs, isLoading: notifLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => { const r = await api.get('/api/admin/notifications'); return r.data as any[]; },
    enabled: section === 'notifications' && user?.role === 'ADMIN',
    refetchInterval: section === 'notifications' ? 10000 : false,
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      const r = await api.post('/api/admin/notifications/send', notifForm);
      return r.data;
    },
    onSuccess: (data) => {
      setNotifResult(data);
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success(`Sent to ${data.sentCount} device${data.sentCount !== 1 ? 's' : ''}!`);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to send notification.'),
  });

  useEffect(() => {
    if (settingsData) setSettingsForm(settingsData);
  }, [settingsData]);

  const saveSettings = useMutation({
    mutationFn: async (updates: Record<string, string>) => api.patch('/api/admin/settings', updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Settings saved!'); },
    onError: () => toast.error('Failed to save settings'),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent'],
    queryFn: async () => { const r = await api.get('/api/admin/stats/recent'); return r.data; },
    enabled: section === 'dashboard' && user?.role === 'ADMIN',
    refetchInterval: 60000,
  });

  const createZone = useMutation({
    mutationFn: async () => api.post('/api/zones/admin', {
      name: zoneForm.name,
      polygon: zoneForm.polygon,
      categories: zoneForm.categories,
      bannerIds: zoneForm.bannerIds,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-zones'] });
      setZoneForm({ name: '', categories: [], bannerIds: [], polygon: [] });
      toast.success('Zone created!');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create zone.'),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/zones/admin/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-zones'] }); toast.success('Zone deleted.'); },
  });

  const toggleZoneActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/zones/admin/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-zones'] }),
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/admin/vendors/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-vendors'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Vendor deleted.'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed.'),
  });

  const deleteShop = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/admin/shops/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shops'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Shop deleted.'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed.'),
  });

  const updateReservationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/api/admin/reservations/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reservations'] }); toast.success('Status updated.'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/admin/reviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review deleted.'); },
  });

  // ── Edit mutations ──────────────────────────────────────────────────

  const updateBanner = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/admin/banners/${editingBanner.id}`, { ...editBannerForm, sortOrder: Number(editBannerForm.sortOrder) });
      if (editBannerFile) {
        const fd = new FormData();
        fd.append('image', editBannerFile);
        await api.post(`/api/admin/banners/${editingBanner.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['promo-banners'] });
      setEditingBanner(null);
      setEditBannerFile(null);
      setEditBannerPreviewUrl(null);
      if (editBannerFileRef.current) editBannerFileRef.current.value = '';
      toast.success('Banner updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const updateVendor = useMutation({
    mutationFn: async () => api.patch(`/api/admin/vendors/${editingVendor.id}`, editVendorForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      setEditingVendor(null);
      toast.success('Vendor updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const updateShop = useMutation({
    mutationFn: async () => {
      const { lat, lng, ...rest } = editShopForm;
      return api.patch(`/api/admin/shops/${editingShop.id}`, {
        ...rest,
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setEditingShop(null);
      toast.success('Shop updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const updateZone = useMutation({
    mutationFn: async () => api.patch(`/api/zones/admin/${editingZone.id}`, {
      name: editZoneForm.name,
      categories: editZoneForm.categories,
      bannerIds: editZoneForm.bannerIds,
      polygon: editZoneForm.polygon,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-zones'] });
      setEditingZone(null);
      toast.success('Zone updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const openEditBanner = (b: any) => {
    setEditingBanner(b);
    setEditBannerForm({ title: b.title, subtitle: b.subtitle ?? '', ctaText: b.ctaText, ctaLink: b.ctaLink, gradient: b.gradient, sortOrder: String(b.sortOrder) });
  };

  const openEditVendor = (v: any) => {
    setEditingVendor(v);
    setEditVendorForm({ name: v.name, shopName: v.shopName, plan: v.plan });
  };

  const openEditShop = (s: any) => {
    setEditingShop(s);
    setEditShopForm({ name: s.name, description: s.description ?? '', address: s.address, area: s.area, phone: s.phone, whatsapp: s.whatsapp ?? '', openingTime: s.openingTime, closingTime: s.closingTime, category: s.category, isOpen: s.isOpen, lat: String(s.latitude ?? ''), lng: String(s.longitude ?? '') });
  };

  const openEditZone = (z: any) => {
    setEditingZone(z);
    setEditZoneForm({ name: z.name, categories: z.categories ?? [], bannerIds: (z.banners ?? []).map((b: any) => b.id), polygon: z.polygon ?? [] });
  };

  const createBanner = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/banners', { ...bannerForm, sortOrder: Number(bannerForm.sortOrder) });
      const newBanner = res.data;
      if (bannerFile) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
          const fd = new FormData();
          fd.append('image', bannerFile);
          await api.post(`/api/admin/banners/${newBanner.id}/image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              setUploadProgress(pct);
            },
          });
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Image upload failed.');
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
      return newBanner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['promo-banners'] });
      setBannerForm({ title: '', subtitle: '', ctaText: '', ctaLink: '', gradient: 'from-teal-600 to-emerald-500', sortOrder: '0' });
      setBannerFile(null);
      setBannerPreviewUrl(null);
      if (newBannerFileRef.current) newBannerFileRef.current.value = '';
      toast.success('Banner created successfully!');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create banner.'),
  });

  const uploadBannerImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/api/admin/banners/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Image uploaded.');
    },
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/api/admin/banners/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['promo-banners'] });
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/admin/banners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner deleted.');
    },
  });

  const verifyVendor = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/api/admin/vendors/${id}/verify`, { isVerified }),
    onSuccess: (_, { isVerified }) => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(isVerified ? 'Vendor approved.' : 'Vendor suspended.');
    },
  });

  const toggleProductStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) =>
      api.patch(`/api/admin/products/${id}/stock`, { inStock }),
    onSuccess: (_, { inStock }) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(inStock ? 'Marked as In Stock.' : 'Marked as Out of Stock.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const toggleProductFeatured = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/api/admin/products/${id}/featured`, { isFeatured }),
    onSuccess: (_, { isFeatured }) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isFeatured ? 'Product featured!' : 'Removed from featured.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  const uploadShopImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post(`/api/admin/shops/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data;
    },
    onSuccess: (data: any, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setEditingShop((prev: any) => (prev && prev.id === id ? { ...prev, coverImage: data.coverImage } : prev));
      toast.success('Shop cover image updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Upload failed.'),
  });

  const uploadProductImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post(`/api/admin/products/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product image updated.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Upload failed.'),
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const r = await api.post('/api/admin/products', {
        ...newProductForm,
        price: parseFloat(newProductForm.price),
        mrp: newProductForm.mrp ? parseFloat(newProductForm.mrp) : undefined,
      });
      return r.data;
    },
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created — now add at least one photo.');
      setNewProductSaved(product);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create product.'),
  });

  const uploadNewProductPhoto = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post(`/api/admin/products/${newProductSaved.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data as { images: string[] };
    },
    onSuccess: (data) => {
      setNewProductSaved((p: any) => (p ? { ...p, images: data.images } : p));
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Upload failed.'),
  });

  const deleteNewProductPhoto = useMutation({
    mutationFn: async (url: string) => {
      const r = await api.delete(`/api/admin/products/${newProductSaved.id}/image`, { data: { url } });
      return r.data as { images: string[] };
    },
    onSuccess: (data) => {
      setNewProductSaved((p: any) => (p ? { ...p, images: data.images } : p));
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to remove.'),
  });

  const closeCreateProduct = () => {
    setCreatingProduct(false);
    setNewProductSaved(null);
    setNewProductForm({ shopId: '', name: '', description: '', price: '', mrp: '', category: '', tags: '' });
  };

  const importVendorsShops = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      setImportingVendorsShops(true);
      const r = await api.post('/api/admin/vendors-shops/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 });
      return r.data as { vendorsCreated: number; shopsCreated: number; failed: number; errors: { row: number; error: string }[] };
    },
    onSuccess: (data) => {
      if (data.shopsCreated > 0) {
        qc.invalidateQueries({ queryKey: ['admin-vendors'] });
        qc.invalidateQueries({ queryKey: ['admin-shops'] });
        qc.invalidateQueries({ queryKey: ['admin-stats'] });
      }
      if (data.failed === 0) {
        toast.success(`Imported ${data.shopsCreated} shop${data.shopsCreated === 1 ? '' : 's'} (${data.vendorsCreated} new vendor${data.vendorsCreated === 1 ? '' : 's'}).`);
      } else {
        toast.error(`Imported ${data.shopsCreated}, ${data.failed} failed. Row ${data.errors[0]?.row}: ${data.errors[0]?.error}`, { duration: 6000 });
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Import failed.'),
    onSettled: () => setImportingVendorsShops(false),
  });

  const downloadVendorShopTemplate = () => {
    const header = 'vendorPhone,vendorName,vendorEmail,shopName,shopPhone,whatsapp,category,address,area,city,latitude,longitude,openingTime,closingTime,description';
    const example = '9666600000,Ravi Kumar,ravi@example.com,Ravi Electronics,,9666600000,ELECTRONICS,123 Main Road,MG Road,Vijayawada,16.5062,80.648,09:00,21:00,Optional description';
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vendors-shops-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const suspendShop = useMutation({
    mutationFn: async ({ id, suspended, reason }: { id: string; suspended: boolean; reason?: string }) =>
      api.patch(`/api/admin/shops/${id}/suspend`, { suspended, reason }),
    onSuccess: (_, { suspended }) => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setSuspendModal(null);
      setSuspendReason('');
      toast.success(suspended ? 'Shop suspended.' : 'Shop unsuspended.');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed.'),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, isFeatured, days }: { id: string; isFeatured: boolean; days?: number }) =>
      api.patch(`/api/admin/shops/${id}/featured`, { isFeatured, days }),
    onSuccess: (_, { isFeatured }) => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(isFeatured ? 'Shop featured!' : 'Featured removed.');
    },
  });

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const exportCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row => columns.map(c => {
      const val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'ADMIN') return null;

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.users ?? '—', icon: <Users size={22} />, bg: '#3b82f6', change: 'Customers registered' },
    { label: 'Vendors', value: stats?.vendors ?? '—', icon: <Store size={22} />, bg: '#8b5cf6', change: 'Shop owners' },
    { label: 'Shops', value: stats?.shops ?? '—', icon: <MapPin size={22} />, bg: '#10b981', change: 'Listed shops' },
    { label: 'Reservations', value: stats?.reservations ?? '—', icon: <ShoppingBag size={22} />, bg: '#f59e0b', change: 'Total bookings' },
    { label: 'Reviews', value: stats?.reviews ?? '—', icon: <Star size={22} />, bg: '#ef4444', change: 'Customer reviews' },
    { label: 'Featured Shops', value: stats?.featuredShops ?? '—', icon: <TrendingUp size={22} />, bg: '#06b6d4', change: 'Premium listings' },
  ];

  const sectionLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === section)?.label ?? 'Dashboard';

  return (
    <>
    <div className={`ry-panel${panelDark ? ' panel-dark' : ''} flex overflow-hidden`} style={{ height: '100dvh', background: panelDark ? '#000000' : '#f0f4f8' }}>

      {/* ── Sidebar Overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        style={{ width: '260px', background: panelDark ? '#000000' : '#0f3d2e', flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: panelDark ? '#2a2a2a' : 'rgba(255,255,255,0.1)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{ background: panelDark ? '#222222' : '#16a34a' }}>R</div>
          <div>
            <p className="text-white font-black text-base leading-none">RadiuYes</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: panelDark ? '#555555' : '#4ade80' }}>Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-xs font-bold px-3 mb-2" style={{ color: panelDark ? '#555555' : 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-semibold transition-all"
                    style={{
                      color: panelDark
                        ? (active ? '#ffffff' : '#888888')
                        : (active ? '#fff' : 'rgba(255,255,255,0.6)'),
                      background: panelDark
                        ? (active ? '#2a2a2a' : 'transparent')
                        : (active ? 'rgba(255,255,255,0.12)' : 'transparent'),
                    }}
                  >
                    <span style={{ color: panelDark ? (active ? '#ffffff' : '#555555') : (active ? '#4ade80' : 'rgba(255,255,255,0.4)') }}>{item.icon}</span>
                    {item.label}
                    {active && <ChevronRight size={14} className="ml-auto" style={{ color: panelDark ? '#888888' : '#4ade80' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom padding spacer */}
        <div className="p-2" />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="panel-header flex items-center gap-4 px-5 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>

          <div>
            <h1 className="text-lg font-black text-gray-900">{sectionLabel}</h1>
            <p className="text-xs text-gray-400">RadiuYes Admin · {user?.name}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={togglePanelTheme} title={panelDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors">
              {panelDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/" target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs font-semibold transition-colors"
              title="View site">
              <Search size={14} /> View Site
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500 text-xs font-semibold transition-colors"
              title="Logout">
              <LogOut size={14} /> Logout
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: panelDark ? '#2a2a2a' : '#16a34a', color: '#ffffff' }}>
              {user?.name?.[0] ?? 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {statsLoading
                  ? <div className="col-span-3 flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                  : STAT_CARDS.map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                          <p className="text-4xl font-black text-gray-900 mt-1">{s.value}</p>
                          <p className="text-xs text-gray-400 mt-1">{s.change}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ background: s.bg }}>
                          {s.icon}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Quick links */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Manage Vendors', icon: <Store size={20} />, color: '#8b5cf6', action: () => setSection('vendors') },
                    { label: 'Manage Shops', icon: <MapPin size={20} />, color: '#10b981', action: () => setSection('shops') },
                    { label: 'Add Banner', icon: <Megaphone size={20} />, color: '#f59e0b', action: () => setSection('banners') },
                    { label: 'View Customers', icon: <Users size={20} />, color: '#3b82f6', action: () => setSection('users') },
                  ].map((q) => (
                    <button
                      key={q.label}
                      onClick={q.action}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors text-center"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: q.color }}>
                        {q.icon}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {recentActivity && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-900 mb-3 text-sm">Recent Reservations</h2>
                    {recentActivity.reservations?.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'PENDING' ? 'bg-amber-400' : r.status === 'ACCEPTED' ? 'bg-green-500' : r.status === 'COMPLETED' ? 'bg-blue-500' : r.status === 'DECLINED' ? 'bg-red-400' : 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{r.product?.name} @ {r.shop?.name}</p>
                          <p className="text-xs text-gray-400">{r.user?.name ?? r.user?.phone}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : r.status === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-900 mb-3 text-sm">Recent Vendors</h2>
                    {recentActivity.vendors?.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#8b5cf6' }}>{v.name?.[0] ?? '?'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{v.name}</p>
                          <p className="text-xs text-gray-400">{v.shopName}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{v.isVerified ? 'Verified' : 'Pending'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VENDORS ── */}
          {section === 'vendors' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className="text-sm text-gray-500 flex-1">{vendors?.length ?? 0} vendors total</p>
                <button
                  onClick={() => exportCSV(vendors ?? [], 'vendors.csv', [{key:'name',label:'Name'},{key:'phone',label:'Phone'},{key:'shopName',label:'Shop Name'},{key:'plan',label:'Plan'},{key:'isVerified',label:'Verified'}])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              <input
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendors by name, shop, or phone…"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
              />
              {vendorsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (vendors ?? []).filter((v: any) => {
                    if (!vendorSearch) return true;
                    const q = vendorSearch.toLowerCase();
                    return v.name?.toLowerCase().includes(q) || v.shopName?.toLowerCase().includes(q) || v.phone?.includes(q);
                  }).map((v: any) => (
                  <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ background: '#8b5cf6' }}>
                        {v.name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900">{v.name}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                            {v.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{v.plan}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">+91 {v.phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.shopName} ·{' '}
                          <button
                            onClick={() => { setVendorShopsFilter(v.id); setSection('shops'); }}
                            className="text-green-600 hover:underline font-medium"
                          >
                            {v.shops?.length ?? 0} shop(s)
                          </button>
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        <button onClick={() => openEditVendor(v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => verifyVendor.mutate({ id: v.id, isVerified: true })}
                          disabled={v.isVerified || verifyVendor.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold disabled:opacity-40 border border-green-200"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => verifyVendor.mutate({ id: v.id, isVerified: false })}
                          disabled={!v.isVerified || verifyVendor.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold disabled:opacity-40 border border-red-200"
                        >
                          <XCircle size={13} /> Suspend
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) deleteVendor.mutate(v.id); }}
                          disabled={deleteVendor.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold disabled:opacity-40 border border-red-200"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── SHOPS ── */}
          {section === 'shops' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className="text-sm text-gray-500 flex-1">{shops?.length ?? 0} shops total</p>
                <button
                  onClick={downloadVendorShopTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                >
                  Download Import Template
                </button>
                <button
                  onClick={() => vendorShopImportFileRef.current?.click()}
                  disabled={importingVendorsShops}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {importingVendorsShops ? <><Loader2 size={13} className="animate-spin" /> Importing…</> : <><Upload size={13} /> Import Vendors & Shops</>}
                </button>
                <input
                  ref={vendorShopImportFileRef}
                  type="file" accept=".csv,text/csv" className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importVendorsShops.mutate(file);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => exportCSV(shops ?? [], 'shops.csv', [{key:'name',label:'Name'},{key:'area',label:'Area'},{key:'city',label:'City'},{key:'vendor.name',label:'Vendor'},{key:'isOpen',label:'Open'},{key:'rating',label:'Rating'}])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              <p className="text-xs text-gray-400 -mt-1">
                Each row creates one shop; the vendor account is created automatically (or reused if the email already has one). Photos aren't included — add them per-shop afterward.
              </p>
              <input
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder="Search shops by name or area…"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
              />
              {vendorShopsFilter && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Showing shops for: <strong>{(vendors ?? []).find((v: any) => v.id === vendorShopsFilter)?.name ?? vendorShopsFilter}</strong>
                  </span>
                  <button onClick={() => setVendorShopsFilter(null)} className="text-xs text-red-500 font-bold hover:underline">× clear</button>
                </div>
              )}
              {shopsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (shops ?? [])
                    .filter((s: any) => vendorShopsFilter ? s.vendor?.id === vendorShopsFilter : true)
                    .filter((s: any) => {
                      if (!shopSearch) return true;
                      const q = shopSearch.toLowerCase();
                      return s.name?.toLowerCase().includes(q) || s.area?.toLowerCase().includes(q);
                    })
                    .map((s: any) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ background: '#10b981' }}>
                        {s.name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900">{s.name}</p>
                          {s.isFeatured && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-amber-500">Featured</span>
                          )}
                          {s.isSuspended && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">Suspended</span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{s.area}, {s.city}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.vendor?.name} · ★ {s.rating.toFixed(1)} · {s._count?.products ?? 0} products
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        <button onClick={() => openEditShop(s)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                          <Pencil size={12} /> Edit
                        </button>
                        <label
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 cursor-pointer"
                          title={s.coverImage ? 'Replace cover image' : 'Upload cover image'}
                        >
                          <ImagePlus size={12} />
                          {s.coverImage ? 'Cover' : 'Add Cover'}
                          <input
                            type="file" accept="image/*" className="sr-only"
                            ref={(el) => { shopImageRefs.current[s.id] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadShopImage.mutate({ id: s.id, file });
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {!s.isFeatured && (
                          <input
                            type="number" min="1" max="90" placeholder="Days"
                            value={featuredDays[s.id] || ''}
                            onChange={(e) => setFeaturedDays((d) => ({ ...d, [s.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xs focus:border-green-600 focus:outline-none text-gray-700"
                          />
                        )}
                        <button
                          onClick={() => toggleFeatured.mutate({
                            id: s.id,
                            isFeatured: !s.isFeatured,
                            days: !s.isFeatured ? Number(featuredDays[s.id] || 30) : undefined,
                          })}
                          disabled={toggleFeatured.isPending}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            s.isFeatured
                              ? 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                          }`}
                        >
                          {s.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => { setSuspendModal({ id: s.id, name: s.name, isSuspended: s.isSuspended }); setSuspendReason(s.suspendedReason || ''); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            s.isSuspended
                              ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                              : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                          }`}
                        >
                          {s.isSuspended ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {s.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete shop "${s.name}"? This cannot be undone.`)) deleteShop.mutate(s.id); }}
                          disabled={deleteShop.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── LISTINGS (individual sellers) ── */}
          {section === 'listings' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">{listings?.length ?? 0} listings total</p>
              {listingsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : (listings ?? []).map((l: any) => (
                  <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: '#f97316' }}>
                        {l.title?.[0] || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900">{l.title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            l.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                            l.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {l.status}
                          </span>
                          {l.isSuspended && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">Suspended</span>
                          )}
                          {l.pendingReview && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-blue-500">Pending Review</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">₹{l.price} · {l.area}, {l.city}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Seller: {l.seller?.name || 'Unknown'} · {l.seller?.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {l.pendingReview && (
                          <button
                            onClick={() => approveListing.mutate(l.id)}
                            disabled={approveListing.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (l.isSuspended) {
                              suspendListing.mutate({ id: l.id, suspended: false });
                            } else {
                              const reason = window.prompt(`Reason for suspending "${l.title}"?`, 'Violates listing guidelines.');
                              if (reason !== null) suspendListing.mutate({ id: l.id, suspended: true, reason });
                            }
                          }}
                          disabled={suspendListing.isPending}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            l.isSuspended
                              ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                              : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                          }`}
                        >
                          {l.isSuspended ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {l.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
              {!listingsLoading && !listings?.length && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500">No individual-seller listings yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── PLACES ── */}
          {section === 'places' && <PlaceAdminSection type="PLACE" />}

          {/* ── FOOD ── */}
          {section === 'food' && <PlaceAdminSection type="FOOD" />}

          {/* ── CATEGORIES ── */}
          {section === 'categories' && <CategoryAdminSection />}

          {/* ── BANNERS ── */}
          {section === 'banners' && (
            <div className="space-y-5">
              {/* Create form */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-500" /> Add New Banner
                </h2>
                {/* Image upload area */}
                <div>
                  <label className="text-xs text-gray-500 font-semibold block mb-1.5">
                    Banner Image (PNG, JPG, JPEG — 800×250px)
                  </label>
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-colors overflow-hidden"
                    style={{ minHeight: bannerPreviewUrl ? 'auto' : '100px' }}
                  >
                    {bannerPreviewUrl ? (
                      <div className="relative w-full" style={{ height: '280px' }}>
                        <Image src={bannerPreviewUrl} alt="Preview" fill className="object-cover rounded-xl" sizes="600px" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                          <p className="text-white text-xs font-bold">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                        <ImagePlus size={28} />
                        <p className="text-sm font-medium">Click to upload banner image</p>
                        <p className="text-xs">PNG, JPG, JPEG · Max 5MB · Required: 800×400px</p>
                      </div>
                    )}
                    <input
                      ref={newBannerFileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBannerFile(file);
                        const url = URL.createObjectURL(file);
                        setBannerPreviewUrl(url);
                      }}
                    />
                  </label>
                  <div className="flex items-center justify-between mt-1.5">
                    {bannerFile && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)</p>
                    )}
                    {bannerFile && (
                      <button
                        type="button"
                        onClick={() => { setBannerFile(null); setBannerPreviewUrl(null); if (newBannerFileRef.current) newBannerFileRef.current.value = ''; }}
                        className="text-xs text-red-500 hover:underline flex-shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Upload progress bar */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600">Uploading image...</span>
                        <span className="text-xs font-bold text-green-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #16a34a, #4ade80)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Title *"
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                  <input
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))}
                    placeholder="Subtitle (optional)"
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                  <input
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm((f) => ({ ...f, ctaText: e.target.value }))}
                    placeholder="Button text *"
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                  <input
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm((f) => ({ ...f, ctaLink: e.target.value }))}
                    placeholder="Link (e.g. /search?q=shoes) *"
                    className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1.5">Fallback Gradient (used if no image)</label>
                    <select
                      value={bannerForm.gradient}
                      onChange={(e) => setBannerForm((f) => ({ ...f, gradient: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                    >
                      {GRADIENTS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1.5">Sort Order (lower = first)</label>
                    <input
                      type="number"
                      value={bannerForm.sortOrder}
                      onChange={(e) => setBannerForm((f) => ({ ...f, sortOrder: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                      min="0"
                    />
                  </div>
                </div>

                {/* Live preview (gradient fallback only) */}
                {!bannerPreviewUrl && bannerForm.title && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-semibold mb-2">Gradient preview</p>
                    <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${bannerForm.gradient} p-4 flex flex-col gap-1`} style={{ maxWidth: 300, minHeight: 100 }}>
                      <p className="text-white font-black text-base leading-tight">{bannerForm.title}</p>
                      {bannerForm.subtitle && <p className="text-white/80 text-xs">{bannerForm.subtitle}</p>}
                      {bannerForm.ctaText && (
                        <span className="mt-2 inline-block bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg w-fit">{bannerForm.ctaText}</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => createBanner.mutate()}
                  disabled={!bannerForm.title || !bannerForm.ctaText || !bannerForm.ctaLink || createBanner.isPending}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700 transition-colors"
                >
                  {createBanner.isPending
                    ? <><Loader2 size={15} className="animate-spin" /> {isUploading ? `Uploading… ${uploadProgress}%` : 'Creating…'}</>
                    : 'Create Banner'
                  }
                </button>
              </div>

              {/* Banner list */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Existing Banners ({banners?.length ?? 0})</h3>
                {bannersLoading
                  ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                  : banners?.length === 0
                    ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No banners yet. Create one above.</div>
                    : <div className="space-y-3">
                        {banners?.map((b: any) => (
                          <div key={b.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-4 items-center ${!b.isActive ? 'opacity-50' : ''}`}>
                            <div className={`flex-shrink-0 rounded-xl overflow-hidden relative ${!b.imageUrl ? `bg-gradient-to-br ${b.gradient}` : ''}`} style={{ width: '128px', height: '40px' }}>
                              {b.imageUrl
                                ? <Image src={b.imageUrl} alt={b.title} fill className="object-cover" sizes="120px" />
                                : <div className="absolute inset-0 flex items-end p-2">
                                    <p className="text-white text-xs font-bold leading-tight line-clamp-2">{b.title}</p>
                                  </div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                              {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
                              <p className="text-xs text-gray-400 mt-0.5">→ {b.ctaLink} · order #{b.sortOrder}</p>
                              <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {b.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => openEditBanner(b)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500" title="Edit banner">
                                <Pencil size={15} />
                              </button>
                              <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg text-gray-500" title={b.imageUrl ? 'Replace image' : 'Upload image'}>
                                <ImagePlus size={16} />
                                <input
                                  type="file" accept="image/*" className="sr-only"
                                  ref={(el) => { bannerImageRefs.current[b.id] = el; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadBannerImage.mutate({ id: b.id, file });
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <button onClick={() => toggleBanner.mutate({ id: b.id, isActive: !b.isActive })} className="p-2 hover:bg-gray-100 rounded-lg" title={b.isActive ? 'Deactivate' : 'Activate'}>
                                {b.isActive ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                              </button>
                              <button onClick={() => { if (confirm('Delete this banner?')) deleteBanner.mutate(b.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                }
              </div>
            </div>
          )}

          {/* ── USERS (Customers) ── */}
          {section === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className="text-sm text-gray-500 flex-1">{users?.length ?? 0} customers registered</p>
                <button
                  onClick={() => exportCSV(users ?? [], 'customers.csv', [{key:'name',label:'Name'},{key:'phone',label:'Phone'},{key:'_count.reservations',label:'Reservations'},{key:'_count.reviews',label:'Reviews'}])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search customers by name or phone…"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
              />
              {usersLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : users?.length === 0
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No customers yet.</div>
                  : (users ?? []).filter((u: any) => {
                      if (!userSearch) return true;
                      const q = userSearch.toLowerCase();
                      return u.name?.toLowerCase().includes(q) || u.phone?.includes(q);
                    }).map((u: any) => (
                    <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: '#3b82f6' }}>
                        {(u.name ?? u.phone)?.[0] ?? '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{u.name ?? 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">+91 {u.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{u._count?.reservations ?? 0} reservations</p>
                        <p className="text-xs text-gray-400">{u._count?.reviews ?? 0} reviews</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── RESERVATIONS ── */}
          {section === 'reservations' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">{reservations?.length ?? 0} total reservations</p>
              {reservationsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : reservations?.length === 0
                  ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No reservations yet.</div>
                  : reservations?.map((r: any) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{
                            background: r.status === 'PENDING' ? '#f59e0b'
                              : r.status === 'ACCEPTED' ? '#10b981'
                              : r.status === 'COMPLETED' ? '#3b82f6'
                              : '#ef4444'
                          }}>
                          <ShoppingBag size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{r.product?.name ?? 'Product'}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                              : r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700'
                              : r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                            }`}>{r.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.shop?.name} · {r.user?.name ?? r.user?.phone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {r.agreedPrice && (
                          <p className="text-sm font-bold text-green-700">₹{r.agreedPrice}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-14">
                        {['PENDING','ACCEPTED','DECLINED','COMPLETED'].map((s) => (
                          <button
                            key={s}
                            onClick={() => r.status !== s && updateReservationStatus.mutate({ id: r.id, status: s })}
                            disabled={r.status === s || updateReservationStatus.isPending}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                              r.status === s
                                ? s === 'PENDING' ? 'bg-amber-400 text-white' : s === 'ACCEPTED' ? 'bg-green-600 text-white' : s === 'COMPLETED' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── ZONES ── */}
          {section === 'zones' && (
            <div className="space-y-5">

              {/* Create zone form */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-green-600" /> Create New Zone
                </h2>

                {/* Zone name */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 font-semibold block mb-1.5">Zone Name *</label>
                  <input
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Vijayawada Central, Benz Circle Area"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                </div>

                {/* Map */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 font-semibold block mb-1.5">
                    Draw Zone Boundary * — click on the map to place points
                  </label>
                  <ZoneMap
                    polygon={zoneForm.polygon}
                    onChange={(p) => setZoneForm((f) => ({ ...f, polygon: p }))}
                    existingZones={(zones ?? []).map((z: any) => ({ name: z.name, polygon: z.polygon }))}
                  />
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 font-semibold block mb-2">
                    Allowed Categories — only these categories show in this zone (leave all unchecked = all categories visible)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_LIST.map((cat) => {
                      const checked = zoneForm.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setZoneForm((f) => ({
                            ...f,
                            categories: checked
                              ? f.categories.filter((c) => c !== cat)
                              : [...f.categories, cat],
                          }))}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                            checked
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400'
                          }`}
                        >
                          {CATEGORY_LABELS_MAP[cat]}
                        </button>
                      );
                    })}
                  </div>
                  {zoneForm.categories.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No categories selected — all categories will be visible.</p>
                  )}
                </div>

                {/* Banners */}
                <div className="mb-5">
                  <label className="text-xs text-gray-500 font-semibold block mb-2">
                    Zone Banners — only these banners appear for users in this zone
                  </label>
                  {!banners || banners.length === 0 ? (
                    <p className="text-xs text-gray-400">No banners yet — create banners first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {banners?.map((b: any) => {
                        const checked = zoneForm.bannerIds.includes(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setZoneForm((f) => ({
                              ...f,
                              bannerIds: checked
                                ? f.bannerIds.filter((id) => id !== b.id)
                                : [...f.bannerIds, b.id],
                            }))}
                            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                              checked
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-400'
                            }`}
                          >
                            {b.imageUrl && (
                              <div className="w-6 h-4 rounded overflow-hidden relative flex-shrink-0">
                                <img src={b.imageUrl} alt="" className="object-cover w-full h-full" />
                              </div>
                            )}
                            {b.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {zoneForm.bannerIds.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No banners selected — global banners will show.</p>
                  )}
                </div>

                <button
                  onClick={() => createZone.mutate()}
                  disabled={!zoneForm.name || zoneForm.polygon.length < 3 || createZone.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700 transition-colors"
                >
                  {createZone.isPending
                    ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                    : <><Plus size={15} /> Create Zone</>
                  }
                </button>
              </div>

              {/* Zone list */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Existing Zones ({zones?.length ?? 0})</h3>
                {zonesLoading
                  ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                  : zones?.length === 0
                    ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No zones yet. Draw one above.</div>
                    : <div className="space-y-3">
                        {zones?.map((z: any) => (
                          <div key={z.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${!z.isActive ? 'opacity-60' : ''}`}>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                                style={{ background: z.isActive ? '#16a34a' : '#9ca3af' }}>
                                <Globe size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-gray-900">{z.name}</p>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${z.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {z.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {(z.polygon as any[]).length} boundary points · {z._count?.shops ?? 0} shops
                                </p>
                                {z.categories?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {z.categories.map((c: string) => (
                                      <span key={c} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{CATEGORY_LABELS_MAP[c]}</span>
                                    ))}
                                  </div>
                                )}
                                {z.banners?.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-1">{z.banners.length} banner{z.banners.length > 1 ? 's' : ''} assigned</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => openEditZone(z)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500" title="Edit zone">
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => toggleZoneActive.mutate({ id: z.id, isActive: !z.isActive })}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title={z.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {z.isActive ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                                </button>
                                <button
                                  onClick={() => { if (confirm(`Delete zone "${z.name}"?`)) deleteZone.mutate(z.id); }}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-400"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                }
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {section === 'products' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                  <input
                    value={productSearch} onChange={e => { setProductSearch(e.target.value); setProductPage(1); }}
                    placeholder="Search by name or SKU…"
                    className="flex-1 min-w-48 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                  />
                  <div className="flex flex-col gap-0.5">
                    <select value={productCategory} onChange={e => { setProductCategory(e.target.value); setProductPage(1); }}
                      className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                      title="Filters by the shop's category, not the product's category">
                      <option value="">All Shop Categories</option>
                      {CATEGORY_LIST.map(c => <option key={c} value={c}>{CATEGORY_LABELS_MAP[c]}</option>)}
                    </select>
                    <span className="text-[10px] text-gray-400 px-1">Filters by shop category</span>
                  </div>
                  <button
                    onClick={() => setCreatingProduct(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={15} /> Add Product
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{productsData?.total ?? 0} products total</p>
                {productsLoading
                  ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                  : productsData?.products?.map((p: any) => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                          {p.image
                            ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>
                          }
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                            <ImagePlus size={14} className="text-white" />
                            <input
                              type="file" accept="image/*" className="sr-only"
                              ref={(el) => { productImageRefs.current[p.id] = el; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadProductImage.mutate({ id: p.id, file });
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{p.sku}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{p.shop?.name} · {p.shop?.area}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Vendor: {p.shop?.vendor?.name}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-green-700">₹{p.price}</p>
                            {p.mrp && <p className="text-xs text-gray-400 line-through mt-0.5">₹{p.mrp}</p>}
                          </div>
                          <button
                            onClick={() => toggleProductFeatured.mutate({ id: p.id, isFeatured: !p.isFeatured })}
                            disabled={toggleProductFeatured.isPending}
                            title={p.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${p.isFeatured ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-500'}`}
                          >
                            ★
                          </button>
                          <button
                            onClick={() => toggleProductStock.mutate({ id: p.id, inStock: !p.inStock })}
                            disabled={toggleProductStock.isPending}
                            title={p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {p.inStock
                              ? <ToggleRight size={22} className="text-green-600" />
                              : <ToggleLeft size={22} className="text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
                {productsData && productsData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                    <span className="text-sm text-gray-500">Page {productPage} of {productsData.totalPages}</span>
                    <button onClick={() => setProductPage(p => Math.min(productsData.totalPages, p + 1))} disabled={productPage === productsData.totalPages}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PUSH NOTIFICATIONS ── */}
          {section === 'notifications' && (
            <div className="space-y-6">
              {/* Send form */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Send size={18} className="text-green-600" /> Send Push Notification
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Title</label>
                    <input
                      value={notifForm.title}
                      onChange={(e) => setNotifForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. New shops near you!"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Message</label>
                    <textarea
                      value={notifForm.body}
                      onChange={(e) => setNotifForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="e.g. Check out 5 new shops that opened in your area."
                      rows={3}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Send To</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'all', label: 'Everyone', icon: <UsersRound size={15} /> },
                        { value: 'users', label: 'Customers Only', icon: <UserCheck size={15} /> },
                        { value: 'vendors', label: 'Vendors Only', icon: <Building2 size={15} /> },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNotifForm(f => ({ ...f, target: opt.value }))}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                            notifForm.target === opt.value
                              ? 'bg-green-600 text-white border-green-600'
                              : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-400'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => { setNotifResult(null); sendNotification.mutate(); }}
                      disabled={!notifForm.title.trim() || !notifForm.body.trim() || sendNotification.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {sendNotification.isPending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Now</>}
                    </button>
                    {notifResult && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle size={15} /> {notifResult.sentCount} delivered
                        </span>
                        {notifResult.failCount > 0 && (
                          <span className="flex items-center gap-1 text-red-500 font-semibold">
                            <XCircle size={15} /> {notifResult.failCount} failed
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">{notifResult.totalTokens} total devices</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-green-600" /> Notification History
                </h2>
                {notifLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-green-600" size={24} /></div>
                ) : !notifLogs?.length ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No notifications sent yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-2 pr-4">Title</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-2 pr-4">Message</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-2 pr-4">Target</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-2 pr-4">Sent</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {notifLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-3 pr-4 font-semibold text-gray-800 dark:text-gray-100 max-w-[160px] truncate">{log.title}</td>
                            <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 max-w-[220px] truncate">{log.body}</td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                                log.target === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                log.target === 'users' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                              }`}>
                                {log.target === 'all' ? 'Everyone' : log.target === 'users' ? 'Customers' : 'Vendors'}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-green-600 font-bold">{log.sentCount}</span>
                              {log.failCount > 0 && <span className="text-red-400 ml-1 text-xs">({log.failCount} failed)</span>}
                            </td>
                            <td className="py-3 text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === 'settings' && (
            <div className="space-y-6">
              {settingsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
              ) : (
                <>
                  {/* ── General ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 text-sm">General</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'site_name', label: 'Site Name' },
                        { key: 'site_tagline', label: 'Site Tagline' },
                        { key: 'contact_email', label: 'Contact Email' },
                        { key: 'contact_phone', label: 'Contact Phone' },
                        { key: 'support_whatsapp', label: 'Support WhatsApp' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <input
                            value={settingsForm[key] ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Location ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 text-sm">Location Defaults</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'default_city', label: 'Default City' },
                        { key: 'default_lat', label: 'Default Latitude' },
                        { key: 'default_lng', label: 'Default Longitude' },
                        { key: 'search_radius_km', label: 'Search Radius (km)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <input
                            value={settingsForm[key] ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Business Rules ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 text-sm">Business Rules</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'reservation_expiry_hours', label: 'Reservation Expiry (hours)' },
                        { key: 'featured_shop_default_days', label: 'Featured Shop Days (default)' },
                        { key: 'max_gallery_images', label: 'Max Gallery Images per Shop' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <input
                            type="number"
                            value={settingsForm[key] ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Pre-Owned / Classifieds ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 text-sm">Pre-Owned / Classifieds</h2>
                    <div className="flex items-center justify-between gap-4 max-w-md">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">1 listing per 7 days limit</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          When enabled, individual sellers can post only 1 new listing every 7 days. Disable to let them post unlimited listings.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settingsForm.listing_rate_limit_enabled !== 'false'}
                        onClick={() => setSettingsForm(f => ({
                          ...f,
                          listing_rate_limit_enabled: (f.listing_rate_limit_enabled ?? 'true') === 'false' ? 'true' : 'false',
                        }))}
                        className="relative flex-shrink-0 w-12 h-7 rounded-full transition-colors"
                        style={{ backgroundColor: settingsForm.listing_rate_limit_enabled !== 'false' ? 'var(--ry-green, #16a34a)' : '#d1d5db' }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                          style={{ transform: settingsForm.listing_rate_limit_enabled !== 'false' ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* ── Plan Limits ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 text-sm">Plan Shop Limits</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'plan_free_shops', label: 'FREE plan (shops)' },
                        { key: 'plan_starter_shops', label: 'STARTER plan (shops)' },
                        { key: 'plan_pro_shops', label: 'PRO plan (shops)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <input
                            type="number"
                            value={settingsForm[key] ?? ''}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                            min="1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── API: SMTP ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">SMTP (Email)</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Used for vendor OTP emails and password resets.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'smtp_user', label: 'SMTP Username / Gmail', sensitive: false },
                        { key: 'smtp_pass', label: 'App Password', sensitive: true },
                        { key: 'smtp_from', label: 'From Address', sensitive: false },
                      ].map(({ key, label, sensitive }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type={sensitive && !settingsVisible[key] ? 'password' : 'text'}
                              value={settingsForm[key] ?? ''}
                              onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                              onFocus={e => { if (e.target.value === MASKED) setSettingsForm(f => ({ ...f, [key]: '' })); }}
                              className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                            />
                            {sensitive && (
                              <button type="button" onClick={() => setSettingsVisible(v => ({ ...v, [key]: !v[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {settingsVisible[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── API: Resend ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Resend (Email API)</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Preferred over SMTP when set — works on hosts with blocked SMTP ports (e.g. Railway).</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'resend_api_key', label: 'API Key', sensitive: true },
                        { key: 'resend_from', label: 'From Address', sensitive: false },
                      ].map(({ key, label, sensitive }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type={sensitive && !settingsVisible[key] ? 'password' : 'text'}
                              value={settingsForm[key] ?? ''}
                              onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                              onFocus={e => { if (e.target.value === MASKED) setSettingsForm(f => ({ ...f, [key]: '' })); }}
                              className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                            />
                            {sensitive && (
                              <button type="button" onClick={() => setSettingsVisible(v => ({ ...v, [key]: !v[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {settingsVisible[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── API: MSG91 ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">MSG91 (SMS OTP)</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Used for customer login OTPs via SMS.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'msg91_auth_key', label: 'Auth Key', sensitive: true },
                        { key: 'msg91_template_id', label: 'OTP Template ID', sensitive: false },
                      ].map(({ key, label, sensitive }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type={sensitive && !settingsVisible[key] ? 'password' : 'text'}
                              value={settingsForm[key] ?? ''}
                              onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                              onFocus={e => { if (e.target.value === MASKED) setSettingsForm(f => ({ ...f, [key]: '' })); }}
                              className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                            />
                            {sensitive && (
                              <button type="button" onClick={() => setSettingsVisible(v => ({ ...v, [key]: !v[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {settingsVisible[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── API: Pusher ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Pusher (Real-time)</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Used for live reservation notifications in vendor dashboard.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'pusher_app_id', label: 'App ID', sensitive: false },
                        { key: 'pusher_key', label: 'Key', sensitive: false },
                        { key: 'pusher_secret', label: 'Secret', sensitive: true },
                      ].map(({ key, label, sensitive }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type={sensitive && !settingsVisible[key] ? 'password' : 'text'}
                              value={settingsForm[key] ?? ''}
                              onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                              onFocus={e => { if (e.target.value === MASKED) setSettingsForm(f => ({ ...f, [key]: '' })); }}
                              className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                            />
                            {sensitive && (
                              <button type="button" onClick={() => setSettingsVisible(v => ({ ...v, [key]: !v[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {settingsVisible[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── API: Anthropic ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Anthropic (AI Search)</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Used for natural-language product and shop search.</p>
                    </div>
                    <div className="max-w-md">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">API Key</label>
                      <div className="relative">
                        <input
                          type={settingsVisible['anthropic_api_key'] ? 'text' : 'password'}
                          value={settingsForm['anthropic_api_key'] ?? ''}
                          onChange={e => setSettingsForm(f => ({ ...f, anthropic_api_key: e.target.value }))}
                          onFocus={e => { if (e.target.value === MASKED) setSettingsForm(f => ({ ...f, anthropic_api_key: '' })); }}
                          className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800"
                        />
                        <button type="button" onClick={() => setSettingsVisible(v => ({ ...v, anthropic_api_key: !v['anthropic_api_key'] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {settingsVisible['anthropic_api_key'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveSettings.mutate(settingsForm)}
                      disabled={saveSettings.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
                    >
                      {saveSettings.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {section === 'reviews' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">{reviews?.length ?? 0} reviews total</p>
              {reviewsLoading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                : reviews?.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: '#f59e0b' }}>
                        <Star size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{r.shop?.name}</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-sm ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{r.user?.name ?? r.user?.phone} · {r.product?.name}</p>
                        {r.comment && <p className="text-sm text-gray-700 mt-1.5 leading-snug">{r.comment}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button onClick={() => { if (confirm('Delete this review?')) deleteReview.mutate(r.id); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 flex-shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

        </main>
      </div>
    </div>

    {/* ── EDIT BANNER MODAL ── */}
    {editingBanner && (
      <AdminModal title={`Edit Banner — ${editingBanner.title}`} onClose={() => setEditingBanner(null)}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Title *</label>
            <input value={editBannerForm.title} onChange={(e) => setEditBannerForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Subtitle</label>
            <input value={editBannerForm.subtitle} onChange={(e) => setEditBannerForm(f => ({ ...f, subtitle: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Button Text *</label>
              <input value={editBannerForm.ctaText} onChange={(e) => setEditBannerForm(f => ({ ...f, ctaText: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Link *</label>
              <input value={editBannerForm.ctaLink} onChange={(e) => setEditBannerForm(f => ({ ...f, ctaLink: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gradient</label>
              <select value={editBannerForm.gradient} onChange={(e) => setEditBannerForm(f => ({ ...f, gradient: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800">
                {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Sort Order</label>
              <input type="number" value={editBannerForm.sortOrder} onChange={(e) => setEditBannerForm(f => ({ ...f, sortOrder: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" min="0" />
            </div>
          </div>
          {/* Current image preview */}
          {editingBanner.imageUrl && !editBannerPreviewUrl && (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '120px' }}>
              <Image src={editingBanner.imageUrl} alt={editingBanner.title} fill className="object-cover" sizes="500px" />
            </div>
          )}
          {/* Replace image upload */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Replace Image (optional)</label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-colors overflow-hidden"
              style={{ minHeight: editBannerPreviewUrl ? 'auto' : '72px' }}>
              {editBannerPreviewUrl ? (
                <div className="relative w-full" style={{ height: '160px' }}>
                  <Image src={editBannerPreviewUrl} alt="Preview" fill className="object-cover rounded-xl" sizes="500px" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                    <p className="text-white text-xs font-bold">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-3 text-gray-400">
                  <ImagePlus size={18} />
                  <p className="text-xs font-medium">Click to upload new image</p>
                </div>
              )}
              <input ref={editBannerFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setEditBannerFile(file);
                  setEditBannerPreviewUrl(URL.createObjectURL(file));
                }}
              />
            </label>
            {editBannerFile && (
              <button type="button" onClick={() => { setEditBannerFile(null); setEditBannerPreviewUrl(null); if (editBannerFileRef.current) editBannerFileRef.current.value = ''; }}
                className="text-xs text-red-500 hover:underline mt-1">Remove new image</button>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => updateBanner.mutate()} disabled={!editBannerForm.title || !editBannerForm.ctaText || !editBannerForm.ctaLink || updateBanner.isPending} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {updateBanner.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
            </button>
            <button onClick={() => { setEditingBanner(null); setEditBannerFile(null); setEditBannerPreviewUrl(null); if (editBannerFileRef.current) editBannerFileRef.current.value = ''; }} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </AdminModal>
    )}

    {/* ── EDIT VENDOR MODAL ── */}
    {editingVendor && (
      <AdminModal title={`Edit Vendor — ${editingVendor.name}`} onClose={() => setEditingVendor(null)}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Owner Name</label>
            <input value={editVendorForm.name} onChange={(e) => setEditVendorForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Shop Name</label>
            <input value={editVendorForm.shopName} onChange={(e) => setEditVendorForm(f => ({ ...f, shopName: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Plan</label>
            <div className="flex gap-2 flex-wrap">
              {PLANS.map(p => (
                <button key={p} type="button" onClick={() => setEditVendorForm(f => ({ ...f, plan: p }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${editVendorForm.plan === p ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-400'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => updateVendor.mutate()} disabled={updateVendor.isPending} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {updateVendor.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
            </button>
            <button onClick={() => setEditingVendor(null)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </AdminModal>
    )}

    {/* ── CREATE PRODUCT MODAL ── */}
    {creatingProduct && (
      <AdminModal title="Add Product" onClose={closeCreateProduct} width="max-w-lg">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Shop *</label>
            <select
              value={newProductForm.shopId}
              onChange={(e) => setNewProductForm(f => ({ ...f, shopId: e.target.value }))}
              disabled={!!newProductSaved}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select a shop…</option>
              {(shops ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.area}</option>)}
            </select>
          </div>
          <input
            value={newProductForm.name} onChange={(e) => setNewProductForm(f => ({ ...f, name: e.target.value }))}
            disabled={!!newProductSaved} placeholder="Product name *"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <textarea
            value={newProductForm.description} onChange={(e) => setNewProductForm(f => ({ ...f, description: e.target.value }))}
            disabled={!!newProductSaved} placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number" value={newProductForm.price} onChange={(e) => setNewProductForm(f => ({ ...f, price: e.target.value }))}
                disabled={!!newProductSaved} placeholder="Price *"
                className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number" value={newProductForm.mrp} onChange={(e) => setNewProductForm(f => ({ ...f, mrp: e.target.value }))}
                disabled={!!newProductSaved} placeholder="MRP (strike-off)"
                className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          <input
            value={newProductForm.tags} onChange={(e) => setNewProductForm(f => ({ ...f, tags: e.target.value }))}
            disabled={!!newProductSaved} placeholder="Tags: mobile, samsung, charger"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
          />

          {!newProductSaved ? (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => createProduct.mutate()}
                disabled={!newProductForm.shopId || !newProductForm.name || !newProductForm.price || createProduct.isPending}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700"
              >
                {createProduct.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save & Add Photos'}
              </button>
              <button onClick={closeCreateProduct} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Photos ({(newProductSaved.images ?? []).length}/5) — at least 1 required
                </label>
                <div className="flex flex-wrap gap-2">
                  {(newProductSaved.images ?? []).map((url: string) => (
                    <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                      <Image src={url} alt="Product" fill className="object-cover" sizes="64px" />
                      {(newProductSaved.images ?? []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteNewProductPhoto.mutate(url)}
                          disabled={deleteNewProductPhoto.isPending || uploadNewProductPhoto.isPending}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-50"
                        >
                          <XCircle size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {(newProductSaved.images ?? []).length < 5 && (
                    <button
                      type="button"
                      onClick={() => newProductPhotoRef.current?.click()}
                      disabled={uploadNewProductPhoto.isPending}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-600 disabled:opacity-50 flex-shrink-0"
                    >
                      {uploadNewProductPhoto.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                    </button>
                  )}
                </div>
                <input
                  ref={newProductPhotoRef}
                  type="file" accept="image/*" className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadNewProductPhoto.mutate(file);
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeCreateProduct}
                  disabled={(newProductSaved.images ?? []).length < 1}
                  title={(newProductSaved.images ?? []).length < 1 ? 'Add at least 1 photo first' : undefined}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </AdminModal>
    )}

    {/* ── EDIT SHOP MODAL ── */}
    {editingShop && (
      <AdminModal title={`Edit Shop — ${editingShop.name}`} onClose={() => setEditingShop(null)} width="max-w-2xl">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              <div className="relative w-28 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {editingShop.coverImage ? (
                  <Image src={editingShop.coverImage} alt={editingShop.name} fill className="object-cover" sizes="112px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImagePlus size={18} className="text-gray-400" /></div>
                )}
              </div>
              <button
                type="button"
                onClick={() => editShopImageRef.current?.click()}
                disabled={uploadShopImage.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              >
                {uploadShopImage.isPending ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                {editingShop.coverImage ? 'Replace' : 'Upload'}
              </button>
              <input
                ref={editShopImageRef}
                type="file" accept="image/*" className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadShopImage.mutate({ id: editingShop.id, file });
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Shop Name</label>
              <input value={editShopForm.name} onChange={(e) => setEditShopForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
              <select value={editShopForm.category} onChange={(e) => setEditShopForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800">
                {CATEGORY_LIST.map(c => <option key={c} value={c}>{CATEGORY_LABELS_MAP[c]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
            <textarea value={editShopForm.description} onChange={(e) => setEditShopForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Address</label>
            <input value={editShopForm.address} onChange={(e) => setEditShopForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Area</label>
              <input value={editShopForm.area} onChange={(e) => setEditShopForm(f => ({ ...f, area: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
              <input value={editShopForm.phone} onChange={(e) => setEditShopForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">WhatsApp</label>
              <input value={editShopForm.whatsapp} onChange={(e) => setEditShopForm(f => ({ ...f, whatsapp: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => setEditShopForm(f => ({ ...f, isOpen: v }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${editShopForm.isOpen === v ? (v ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500') : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {v ? 'Open' : 'Closed'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Opening Time</label>
              <input type="time" value={editShopForm.openingTime} onChange={(e) => setEditShopForm(f => ({ ...f, openingTime: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Closing Time</label>
              <input type="time" value={editShopForm.closingTime} onChange={(e) => setEditShopForm(f => ({ ...f, closingTime: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Latitude</label>
              <input type="number" step="any" value={editShopForm.lat} onChange={(e) => setEditShopForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 16.5062" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Longitude</label>
              <input type="number" step="any" value={editShopForm.lng} onChange={(e) => setEditShopForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g. 80.6480" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => updateShop.mutate()} disabled={updateShop.isPending} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {updateShop.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
            </button>
            <button onClick={() => setEditingShop(null)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </AdminModal>
    )}

    {/* ── EDIT ZONE MODAL ── */}
    {editingZone && (
      <AdminModal title={`Edit Zone — ${editingZone.name}`} onClose={() => setEditingZone(null)} width="max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Zone Name</label>
            <input value={editZoneForm.name} onChange={(e) => setEditZoneForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">Redraw Boundary (optional — current: {(editZoneForm.polygon as any[]).length} points)</label>
            <ZoneMap polygon={editZoneForm.polygon} onChange={(p) => setEditZoneForm(f => ({ ...f, polygon: p }))} existingZones={(zones ?? []).filter((z: any) => z.id !== editingZone.id).map((z: any) => ({ name: z.name, polygon: z.polygon }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_LIST.map(cat => {
                const checked = editZoneForm.categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => setEditZoneForm(f => ({ ...f, categories: checked ? f.categories.filter(c => c !== cat) : [...f.categories, cat] }))}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${checked ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400'}`}>
                    {CATEGORY_LABELS_MAP[cat]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">Zone Banners</label>
            <div className="flex flex-wrap gap-2">
              {(banners ?? []).map((b: any) => {
                const checked = editZoneForm.bannerIds.includes(b.id);
                return (
                  <button key={b.id} type="button" onClick={() => setEditZoneForm(f => ({ ...f, bannerIds: checked ? f.bannerIds.filter(id => id !== b.id) : [...f.bannerIds, b.id] }))}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${checked ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-400'}`}>
                    {b.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => updateZone.mutate()} disabled={!editZoneForm.name || updateZone.isPending} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {updateZone.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
            </button>
            <button onClick={() => setEditingZone(null)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </AdminModal>
    )}

    {/* Suspend / Unsuspend Shop Modal */}
    {suspendModal && (
      <AdminModal
        title={suspendModal.isSuspended ? `Unsuspend — ${suspendModal.name}` : `Suspend — ${suspendModal.name}`}
        onClose={() => { setSuspendModal(null); setSuspendReason(''); }}
      >
        <div className="space-y-4">
          {suspendModal.isSuspended ? (
            <p className="text-sm text-gray-600">This will restore the shop and remove the suspension notice shown to the vendor.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">This message will be shown to the shop vendor explaining why their shop has been suspended.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reason for suspension <span className="text-red-500">*</span></label>
                <textarea
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Your shop violated our community guidelines regarding product listings. Please contact support to resolve this."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none text-gray-800"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => suspendShop.mutate({ id: suspendModal.id, suspended: !suspendModal.isSuspended, reason: suspendReason })}
              disabled={suspendShop.isPending || (!suspendModal.isSuspended && !suspendReason.trim())}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${
                suspendModal.isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {suspendShop.isPending ? 'Saving…' : suspendModal.isSuspended ? 'Unsuspend Shop' : 'Suspend Shop'}
            </button>
            <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      </AdminModal>
    )}
    </>
  );
}

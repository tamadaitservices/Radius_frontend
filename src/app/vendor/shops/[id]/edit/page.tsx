'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Loader2, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { useVendorGuard } from '@/hooks/useVendorGuard';
import { useCategories } from '@/hooks/useCategories';

const AREAS = [
  'Governorpet', 'Suryaraopet', 'Benz Circle', 'Auto Nagar', 'Moghalrajpuram',
  'Labbipet', 'Patamata', 'Gunadala', 'One Town', 'Gandhi Nagar',
  'Vijayawada Rural', 'Other',
];

export default function EditShopPage() {
  const { isVendor } = useVendorGuard();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { categories: categoryRows, labels: CATEGORY_LABELS } = useCategories();
  const CATEGORIES = categoryRows.map((c) => c.key);
  const [locating, setLocating] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'ELECTRONICS',
    address: '', area: 'Governorpet', city: 'Vijayawada',
    latitude: '', longitude: '', phone: '', whatsapp: '',
    openingTime: '09:00', closingTime: '21:00',
  });

  const { isLoading } = useQuery({
    queryKey: ['vendor-shop', id],
    queryFn: async () => {
      const r = await api.get('/api/vendor/shops');
      const shop = r.data.find((s: any) => s.id === id);
      if (!shop) throw new Error('Shop not found');
      return shop;
    },
    onSuccess: (shop: any) => {
      if (shop.coverImage) setCoverImage(shop.coverImage);
      setForm({
        name: shop.name || '',
        description: shop.description || '',
        category: shop.category || 'ELECTRONICS',
        address: shop.address || '',
        area: shop.area || 'Governorpet',
        city: shop.city || 'Vijayawada',
        latitude: String(shop.latitude || ''),
        longitude: String(shop.longitude || ''),
        phone: shop.phone || '',
        whatsapp: shop.whatsapp || '',
        openingTime: shop.openingTime || '09:00',
        closingTime: shop.closingTime || '21:00',
      });
    },
  } as any);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success('Location updated!');
      },
      () => { setLocating(false); toast.error('Could not detect location.'); }
    );
  };

  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post(`/api/vendor/shops/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data.url as string;
    },
    onSuccess: (url) => { setCoverImage(url); toast.success('Cover image updated.'); },
    onError: () => toast.error('Image upload failed.'),
  });

  const save = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/vendor/shops/${id}`, {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
    },
    onSuccess: () => {
      toast.success('Shop updated!');
      router.push('/vendor/dashboard');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update shop.'),
  });

  const valid = form.name.length >= 2 && form.address.length >= 5 && /^[6-9]\d{9}$/.test(form.phone);

  if (!isVendor) return null;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={36} /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/dashboard" className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Edit Shop</h1>
          <p className="text-sm text-gray-500">Update your shop details</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Cover image */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Cover Image</label>
          <label className="relative block w-full h-32 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors">
            {coverImage ? (
              <Image src={coverImage} alt="Cover" fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Camera size={24} />
                <span className="text-xs font-medium">Upload cover photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            {uploadCover.isPending && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-green-600" />
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover.mutate(f); e.target.value = ''; }} />
          </label>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Shop Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Raju Electronics" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm resize-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Category *</label>
          <select value={form.category} onChange={set('category')} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm bg-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Full Address *</label>
          <input value={form.address} onChange={set('address')} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Area *</label>
            <select value={form.area} onChange={set('area')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm bg-white">
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">City</label>
            <input value={form.city} onChange={set('city')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Location (GPS)</label>
          <button type="button" onClick={detectLocation} disabled={locating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 mb-2 transition-colors" style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)' }}>
            {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            {locating ? 'Detecting...' : 'Update My Location'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.latitude} onChange={set('latitude')} placeholder="Latitude" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
            <input value={form.longitude} onChange={set('longitude')} placeholder="Longitude" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Shop Phone *</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">WhatsApp</label>
            <input type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Opening Time</label>
            <input type="time" value={form.openingTime} onChange={set('openingTime')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Closing Time</label>
            <input type="time" value={form.closingTime} onChange={set('closingTime')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
        </div>
        <button onClick={() => save.mutate()} disabled={!valid || save.isPending} className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50" style={{ backgroundColor: 'var(--ry-green)' }}>
          {save.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

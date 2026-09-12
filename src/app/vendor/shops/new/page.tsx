'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { MapPin, Loader2, ImagePlus } from 'lucide-react';
import api from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';

const AREAS = [
  'Governorpet', 'Suryaraopet', 'Benz Circle', 'Auto Nagar', 'Moghalrajpuram',
  'Labbipet', 'Patamata', 'Gunadala', 'One Town', 'Gandhi Nagar',
  'Vijayawada Rural', 'Other',
];

export default function NewShopPage() {
  const router = useRouter();
  const { categories: categoryRows, labels: CATEGORY_LABELS } = useCategories();
  const CATEGORIES = categoryRows.map((c) => c.key);
  const [locating, setLocating] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'ELECTRONICS',
    address: '',
    area: 'Governorpet',
    city: 'Vijayawada',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp: '',
    openingTime: '09:00',
    closingTime: '21:00',
  });

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
        toast.success('Location detected!');
      },
      () => {
        setLocating(false);
        toast.error('Could not detect location. Enter coordinates manually.');
      }
    );
  };

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/vendor/shops', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      const shop = res.data;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        try {
          await api.post(`/api/vendor/shops/${shop.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          toast.error('Shop created, but the cover image failed to upload. Add it from My Shop.');
        }
      }
      return shop;
    },
    onSuccess: (shop) => {
      toast.success('Shop created! Now add your products.');
      router.push(`/vendor/products?shopId=${shop.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create shop.'),
  });

  const valid =
    form.name.length >= 2 &&
    form.address.length >= 5 &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    form.latitude !== '' &&
    form.longitude !== '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Add Your Shop</h1>
        <p className="text-sm text-gray-500 mt-1">This is your digital shopfront on RadiuYes</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Shop name */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Shop Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Raju Electronics" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="What do you sell? Special offers?" rows={2} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm resize-none" />
        </div>

        {/* Cover image */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Cover Image</label>
          <div className="relative w-full rounded-xl overflow-hidden mb-2" style={{ height: '140px', background: '#f3f4f6' }}>
            {imagePreview
              ? <Image src={imagePreview} alt="Cover preview" fill className="object-cover" sizes="600px" />
              : <div className="flex items-center justify-center h-full text-gray-400"><ImagePlus size={28} /></div>
            }
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold cursor-pointer w-fit">
            <ImagePlus size={14} /> {imageFile ? 'Replace Image' : 'Add Image (optional)'}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Category *</label>
          <select value={form.category} onChange={set('category')} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm bg-white">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Full Address *</label>
          <input value={form.address} onChange={set('address')} placeholder="Shop 12, MG Road, Governorpet" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
        </div>

        {/* Area + City */}
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

        {/* Location */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Location (GPS) *</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 mb-2 transition-colors"
            style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)' }}
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            {locating ? 'Detecting...' : 'Use My Current Location'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input value={form.latitude} onChange={set('latitude')} placeholder="Latitude (e.g. 16.5062)" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
            </div>
            <div>
              <input value={form.longitude} onChange={set('longitude')} placeholder="Longitude (e.g. 80.6480)" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Used to show your shop in nearby search results</p>
        </div>

        {/* Phone + WhatsApp */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Shop Phone *</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">WhatsApp</label>
            <input type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm" />
          </div>
        </div>

        {/* Hours */}
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

        <button
          onClick={() => create.mutate()}
          disabled={!valid || create.isPending}
          className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
          style={{ backgroundColor: 'var(--ry-green)' }}
        >
          {create.isPending ? 'Creating...' : 'Create Shop & Add Products →'}
        </button>
      </div>
    </div>
  );
}

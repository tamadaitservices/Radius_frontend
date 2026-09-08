'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Camera, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCustomerGuard } from '@/hooks/useCustomerGuard';
import { useLocation } from '@/hooks/useLocation';
import { LISTING_CATEGORY_LABELS, LISTING_CONDITION_LABELS } from '@/lib/utils';

const CATEGORIES = Object.keys(LISTING_CATEGORY_LABELS);
const CONDITIONS = Object.keys(LISTING_CONDITION_LABELS);

export default function NewListingPage() {
  const { isCustomer } = useCustomerGuard();
  const { location } = useLocation();
  const router = useRouter();
  const qc = useQueryClient();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'OTHER', condition: 'USED_GOOD',
    area: '', city: 'Vijayawada',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/listings', {
        ...form,
        price: parseFloat(form.price),
        latitude: location.lat,
        longitude: location.lng,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedId(data.id);
      qc.invalidateQueries({ queryKey: ['listings-nearby'] });
      toast.success('Listing created! Add some photos.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create listing.'),
  });

  const uploadImage = async (file: File) => {
    if (!createdId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post(`/api/listings/${createdId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages(res.data.images);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!isCustomer) return null;

  const valid = form.title.length >= 2 && form.price && Number(form.price) > 0 && form.area.length >= 1;

  if (createdId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-black text-gray-900 mb-1">Add photos</h1>
        <p className="text-sm text-gray-500 mb-5">Listings with photos sell much faster. Add up to 8.</p>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {images.map((src) => (
            <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image src={src} alt="" fill className="object-cover" sizes="100px" />
            </div>
          ))}
          {images.length < 8 && (
            <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-gray-400" />
              ) : (
                <Camera size={20} className="text-gray-400" />
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        <button
          onClick={() => router.push('/sell/my-listings')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: 'var(--ry-green)' }}
        >
          <Check size={16} /> Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-black text-gray-900 mb-1">Post a listing</h1>
      <p className="text-sm text-gray-500 mb-5">You can post 1 listing every 7 days.</p>

      <div className="space-y-3">
        <input value={form.title} onChange={set('title')} placeholder="What are you selling? *" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />
        <textarea value={form.description} onChange={set('description')} placeholder="Description (optional)" rows={3} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none resize-none" />

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input type="number" value={form.price} onChange={set('price')} placeholder="Price *" className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={form.category} onChange={set('category')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none">
            {CATEGORIES.map((c) => <option key={c} value={c}>{LISTING_CATEGORY_LABELS[c]}</option>)}
          </select>
          <select value={form.condition} onChange={set('condition')} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none">
            {CONDITIONS.map((c) => <option key={c} value={c}>{LISTING_CONDITION_LABELS[c]}</option>)}
          </select>
        </div>

        <input value={form.area} onChange={set('area')} placeholder="Area / neighbourhood *" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />

        <button
          onClick={() => create.mutate()}
          disabled={!valid || create.isPending}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
          style={{ backgroundColor: 'var(--ry-orange)' }}
        >
          {create.isPending ? 'Posting...' : 'Post Listing'}
        </button>
      </div>
    </div>
  );
}

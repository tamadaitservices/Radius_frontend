'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Pencil, Trash2, Loader2, Camera, Check, X as XIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, LISTING_CATEGORY_LABELS, LISTING_CONDITION_LABELS } from '@/lib/utils';
import { useCustomerGuard } from '@/hooks/useCustomerGuard';

const CATEGORIES = Object.keys(LISTING_CATEGORY_LABELS);
const CONDITIONS = Object.keys(LISTING_CONDITION_LABELS);

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  area: string;
  images: string[];
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  isSuspended: boolean;
  pendingReview: boolean;
}

function EditForm({ listing, onDone }: { listing: Listing; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: listing.title, description: listing.description ?? '', price: listing.price.toString(),
    category: listing.category, condition: listing.condition, area: listing.area,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: async () => api.patch(`/api/listings/${listing.id}`, { ...form, price: parseFloat(form.price) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings-nearby'] });
      toast.success('Changes submitted — your listing will go back live once admin reviews them.');
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
      <h3 className="font-bold text-gray-900">Edit Listing</h3>
      <input value={form.title} onChange={set('title')} placeholder="Title" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />
      <textarea value={form.description} onChange={set('description')} placeholder="Description" rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none resize-none" />
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input type="number" value={form.price} onChange={set('price')} placeholder="Price" className="w-full pl-7 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <input value={form.area} onChange={set('area')} placeholder="Area" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.category} onChange={set('category')} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none">
          {CATEGORIES.map((c) => <option key={c} value={c}>{LISTING_CATEGORY_LABELS[c]}</option>)}
        </select>
        <select value={form.condition} onChange={set('condition')} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none">
          {CONDITIONS.map((c) => <option key={c} value={c}>{LISTING_CONDITION_LABELS[c]}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--ry-orange)' }}>
          {save.isPending ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

function IncomingContactRequests() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['contact-requests-incoming'],
    queryFn: async () => { const r = await api.get('/api/listings/contact-requests/incoming'); return r.data; },
    refetchInterval: 15000,
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.patch(`/api/listings/contact-requests/${id}/respond`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-requests-incoming'] });
      toast.success(vars.status === 'APPROVED' ? 'Approved — your number was shared with the buyer.' : 'Request rejected.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-500" size={24} /></div>;
  if (!data?.length) return null;

  return (
    <div className="space-y-3 mb-6">
      <h2 className="font-bold text-gray-900 text-sm">Contact Requests</h2>
      {data.map((r: any) => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {r.listing.images?.[0] && <Image src={r.listing.images[0]} alt="" fill className="object-cover" sizes="48px" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{r.listing.title}</p>
              <p className="text-xs text-gray-500">{r.buyer.name || 'Buyer'} offered {formatPrice(r.askingPrice)}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
              r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {r.status}
            </span>
          </div>

          {r.status === 'PENDING' && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => respond.mutate({ id: r.id, status: 'APPROVED' })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold">
                <Check size={13} /> Approve
              </button>
              <button onClick={() => respond.mutate({ id: r.id, status: 'REJECTED' })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
                <XIcon size={13} /> Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyListingsPage() {
  const { isCustomer } = useCustomerGuard();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Listing | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => { const r = await api.get('/api/listings/my'); return r.data as Listing[]; },
    enabled: isCustomer,
  });

  const uploadImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/api/listings/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); toast.success('Photo uploaded.'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Upload failed.'),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings-nearby'] });
      toast.success('Listing deleted.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete.'),
  });

  const markSold = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/listings/${id}`, { status: 'SOLD' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings-nearby'] });
      toast.success('Marked as sold.');
    },
  });

  if (!isCustomer) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-gray-900">My Listings</h1>
        <a href="/sell/my-requests" className="text-sm font-semibold" style={{ color: 'var(--ry-orange)' }}>My Requests →</a>
      </div>

      <IncomingContactRequests />

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" size={32} /></div>}

      {!isLoading && !listings?.length && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-bold text-gray-900 mb-1">No listings yet</p>
          <p className="text-sm text-gray-500 mb-4">Post something you'd like to sell.</p>
          <a href="/sell/new" className="inline-block px-6 py-2 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--ry-orange)' }}>
            Post a Listing
          </a>
        </div>
      )}

      <div className="space-y-3">
        {listings?.map((l) => (
          <div key={l.id}>
            {editing?.id === l.id ? (
              <EditForm listing={l} onDone={() => setEditing(null)} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 items-start">
                <label className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer group">
                  {l.images?.[0] ? (
                    <Image src={l.images[0]} alt={l.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">📦</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                  <input
                    type="file" accept="image/*" className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage.mutate({ id: l.id, file });
                      e.target.value = '';
                    }}
                  />
                </label>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{l.title}</p>
                      <p className="font-black text-gray-900 mt-0.5">{formatPrice(l.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          l.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                          l.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {l.status}
                        </span>
                        {l.isSuspended && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspended</span>
                        )}
                        {l.pendingReview && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Pending Review</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {l.status === 'AVAILABLE' && (
                        <button onClick={() => markSold.mutate(l.id)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600" title="Mark sold">
                          <Clock size={12} /> Mark sold
                        </button>
                      )}
                      <button onClick={() => setEditing(l)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${l.title}"?`)) deleteListing.mutate(l.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Loader2, X, Check, Camera, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useVendorGuard } from '@/hooks/useVendorGuard';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  image: string | null;
  inStock: boolean;
  tags: string[];
}

function ProductForm({
  shopId,
  initial,
  onDone,
}: {
  shopId: string;
  initial?: Product;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price?.toString() ?? '',
    mrp: initial?.mrp?.toString() ?? '',
    tags: initial?.tags?.join(', ') ?? '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      if (initial) {
        await api.patch(`/api/vendor/products/${initial.id}`, { ...form, price: parseFloat(form.price), mrp: form.mrp ? parseFloat(form.mrp) : undefined });
      } else {
        await api.post('/api/vendor/products', { shopId, ...form, price: parseFloat(form.price), mrp: form.mrp ? parseFloat(form.mrp) : undefined });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', shopId] });
      toast.success(initial ? 'Product updated.' : 'Product added.');
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
      <h3 className="font-bold text-gray-900">{initial ? 'Edit Product' : 'Add New Product'}</h3>
      <input value={form.name} onChange={set('name')} placeholder="Product name *" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
      <textarea value={form.description} onChange={set('description')} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none" />
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input type="number" value={form.price} onChange={set('price')} placeholder="Price *" className="w-full pl-7 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input type="number" value={form.mrp} onChange={set('mrp')} placeholder="MRP (strike-off)" className="w-full pl-7 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
        </div>
      </div>
      <input value={form.tags} onChange={set('tags')} placeholder="Tags: mobile, samsung, charger" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
      <div className="flex gap-2">
        <button onClick={() => save.mutate()} disabled={!form.name || !form.price || save.isPending} className="flex-1 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--ry-green)' }}>
          {save.isPending ? 'Saving...' : initial ? 'Save Changes' : 'Add Product'}
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

function ProductsContent() {
  const { isVendor } = useVendorGuard();
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId') || '';
  const qc = useQueryClient();
  const [adding, setAdding] = useState(!shopId ? false : false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Also support no shopId — load first shop
  const { data: shops } = useQuery({
    queryKey: ['vendor-shops'],
    queryFn: async () => { const r = await api.get('/api/vendor/shops'); return r.data; },
  });

  const activeShopId = shopId || shops?.[0]?.id || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ['vendor-products', activeShopId],
    queryFn: async () => { const r = await api.get(`/api/vendor/products/${activeShopId}`); return r.data as Product[]; },
    enabled: !!activeShopId,
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) =>
      api.patch(`/api/vendor/products/${id}/stock`, { inStock }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-products', activeShopId] }),
  });

  const uploadImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/api/vendor/products/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', activeShopId] });
      toast.success('Image uploaded.');
    },
    onError: () => toast.error('Image upload failed.'),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/vendor/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', activeShopId] });
      toast.success('Product deleted.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete.'),
  });

  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('shopId', activeShopId);
      setImporting(true);
      const r = await api.post('/api/vendor/products/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data as { created: number; failed: number; errors: { row: number; error: string }[] };
    },
    onSuccess: (data) => {
      if (data.created > 0) qc.invalidateQueries({ queryKey: ['vendor-products', activeShopId] });
      if (data.failed === 0) {
        toast.success(`Imported ${data.created} product${data.created === 1 ? '' : 's'}.`);
      } else {
        toast.error(`Imported ${data.created}, ${data.failed} failed. Row ${data.errors[0]?.row}: ${data.errors[0]?.error}`, { duration: 6000 });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Import failed.'),
    onSettled: () => setImporting(false),
  });

  const downloadTemplate = () => {
    const header = 'name,description,price,mrp,category,tags';
    const example = 'Example Product,Optional description,499,599,,"tag1, tag2"';
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVendor) return null;

  if (!activeShopId) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No shop found. Create your shop first.</p>
        <a href="/vendor/shops/new" className="px-6 py-2 rounded-lg text-white font-semibold" style={{ backgroundColor: 'var(--ry-green)' }}>Add Shop</a>
      </div>
    );
  }

  const currentShop = shops?.find((s: any) => s.id === activeShopId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Products</h1>
          {currentShop && <p className="text-sm text-gray-500">{currentShop.name}</p>}
        </div>
        {!adding && !editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => importFileRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
            </button>
            <input
              ref={importFileRef}
              type="file" accept=".csv,text/csv" className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv.mutate(file);
                e.target.value = '';
              }}
            />
            <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--ry-green)' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        )}
      </div>
      {!adding && !editing && (
        <button onClick={downloadTemplate} className="text-xs font-semibold text-gray-400 hover:text-gray-600 mb-4 -mt-3 block">
          Download CSV template
        </button>
      )}

      {/* Shop selector */}
      {shops?.length > 1 && (
        <div className="mb-4">
          <select className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-600 focus:outline-none" onChange={(e) => window.location.href = `/vendor/products?shopId=${e.target.value}`} value={activeShopId}>
            {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-4">
          <ProductForm shopId={activeShopId} onDone={() => setAdding(false)} />
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>}

      {!isLoading && !products?.length && !adding && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-bold text-gray-900 mb-1">No products yet</p>
          <p className="text-sm text-gray-500 mb-4">Add your first product so customers can find and reserve it.</p>
          <button onClick={() => setAdding(true)} className="px-6 py-2 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--ry-green)' }}>
            Add First Product
          </button>
        </div>
      )}

      <div className="space-y-3">
        {products?.map((p) => (
          <div key={p.id}>
            {editing?.id === p.id ? (
              <ProductForm shopId={activeShopId} initial={p} onDone={() => setEditing(null)} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 items-start">
                {/* Image with upload */}
                <label className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer group">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">📦</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage.mutate({ id: p.id, file });
                      e.target.value = '';
                    }}
                  />
                </label>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs font-mono text-gray-400">{p.sku}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-black text-gray-900">{formatPrice(p.price)}</span>
                        {p.mrp && p.mrp > p.price && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(p.mrp)}</span>
                        )}
                      </div>
                      {p.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Stock toggle */}
                      <button
                        onClick={() => toggleStock.mutate({ id: p.id, inStock: !p.inStock })}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                        title={p.inStock ? 'Mark out of stock' : 'Mark in stock'}
                      >
                        {p.inStock ? <Check size={12} /> : <X size={12} />}
                        {p.inStock ? 'In stock' : 'Out'}
                      </button>
                      <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p.id); }}
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

export default function VendorProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}

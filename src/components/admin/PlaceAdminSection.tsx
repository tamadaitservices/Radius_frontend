'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Loader2, Landmark, UtensilsCrossed, CheckCircle, XCircle, Pencil, Trash2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS,
  FOOD_CATEGORY_ICONS, FOOD_CATEGORY_LABELS,
} from '@/lib/utils';

interface Props {
  type: 'PLACE' | 'FOOD';
}

const EMPTY_FORM = {
  category: '', name: '', description: '', phone: '', whatsapp: '',
  address: '', area: '', city: 'Vijayawada', latitude: '', longitude: '',
  openingTime: '09:00', closingTime: '21:00',
};

export default function PlaceAdminSection({ type }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const icons = type === 'FOOD' ? FOOD_CATEGORY_ICONS : PLACE_CATEGORY_ICONS;
  const labels = type === 'FOOD' ? FOOD_CATEGORY_LABELS : PLACE_CATEGORY_LABELS;
  const categories = Object.keys(labels);
  const Icon = type === 'FOOD' ? UtensilsCrossed : Landmark;
  const label = type === 'FOOD' ? 'Food' : 'Place';

  const { data: places, isLoading } = useQuery({
    queryKey: ['admin-places', type],
    queryFn: async () => { const r = await api.get('/api/admin/places', { params: { type } }); return r.data; },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-places', type] });

  const createPlace = useMutation({
    mutationFn: async () => api.post('/api/admin/places', {
      ...form,
      type,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      description: form.description || undefined,
    }),
    onSuccess: () => {
      toast.success(`${label} created.`);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create.'),
  });

  const updatePlace = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/admin/places/${id}`, {
      ...editForm,
      latitude: Number(editForm.latitude),
      longitude: Number(editForm.longitude),
      phone: editForm.phone || undefined,
      whatsapp: editForm.whatsapp || undefined,
      description: editForm.description || undefined,
    }),
    onSuccess: () => {
      toast.success('Saved.');
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save.'),
  });

  const suspendPlace = useMutation({
    mutationFn: async ({ id, suspended, reason }: { id: string; suspended: boolean; reason?: string }) =>
      api.patch(`/api/admin/places/${id}/suspend`, { suspended, reason }),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const deletePlace = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/admin/places/${id}`),
    onSuccess: () => { toast.success('Deleted.'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete.'),
  });

  const uploadImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      setUploadingId(id);
      await api.post(`/api/admin/places/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { toast.success('Photo uploaded.'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Upload failed.'),
    onSettled: () => setUploadingId(null),
  });

  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      setImporting(true);
      const r = await api.post(`/api/admin/places/import?type=${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data as { created: number; failed: number; errors: { row: number; error: string }[] };
    },
    onSuccess: (data) => {
      if (data.created > 0) invalidate();
      if (data.failed === 0) {
        toast.success(`Imported ${data.created} ${label.toLowerCase()}${data.created === 1 ? '' : 's'}.`);
      } else {
        toast.error(`Imported ${data.created}, ${data.failed} failed. Row ${data.errors[0]?.row}: ${data.errors[0]?.error}`, { duration: 6000 });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Import failed.'),
    onSettled: () => setImporting(false),
  });

  const downloadTemplate = () => {
    const header = 'category,name,phone,whatsapp,address,area,city,latitude,longitude,openingTime,closingTime,description';
    const example = type === 'FOOD'
      ? 'BIRYANI,Example Restaurant,9666600000,,123 Main Road,MG Road,Vijayawada,16.5062,80.648,10:00,22:00,Optional description'
      : 'PARK,Example Park,9666600000,,123 Main Road,Bhavani Nagar,Vijayawada,16.5062,80.648,06:00,20:00,Optional description';
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type.toLowerCase()}-import-template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (p: any) => {
    setEditing(p);
    setEditForm({
      category: p.category, name: p.name, description: p.description || '', phone: p.phone || '',
      whatsapp: p.whatsapp || '', address: p.address, area: p.area, city: p.city,
      latitude: String(p.latitude), longitude: String(p.longitude),
      openingTime: p.openingTime, closingTime: p.closingTime,
    });
  };

  const inputCls = 'px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800';

  const FormFields = ({ f, setF }: { f: typeof EMPTY_FORM; setF: (fn: (prev: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))} className={inputCls}>
        <option value="">Category *</option>
        {categories.map((c) => <option key={c} value={c}>{icons[c]} {labels[c]}</option>)}
      </select>
      <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" className={inputCls} />
      <input value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone (optional)" className={inputCls} />
      <input value={f.whatsapp} onChange={(e) => setF((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp (optional)" className={inputCls} />
      <input value={f.area} onChange={(e) => setF((p) => ({ ...p, area: e.target.value }))} placeholder="Area *" className={inputCls} />
      <input value={f.city} onChange={(e) => setF((p) => ({ ...p, city: e.target.value }))} placeholder="City" className={inputCls} />
      <input value={f.latitude} onChange={(e) => setF((p) => ({ ...p, latitude: e.target.value }))} placeholder="Latitude *" className={inputCls} />
      <input value={f.longitude} onChange={(e) => setF((p) => ({ ...p, longitude: e.target.value }))} placeholder="Longitude *" className={inputCls} />
      <div>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">Opening Time</label>
        <input type="time" value={f.openingTime} onChange={(e) => setF((p) => ({ ...p, openingTime: e.target.value }))} className={inputCls + ' w-full'} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">Closing Time</label>
        <input type="time" value={f.closingTime} onChange={(e) => setF((p) => ({ ...p, closingTime: e.target.value }))} className={inputCls + ' w-full'} />
      </div>
      <textarea
        value={f.address} onChange={(e) => setF((p) => ({ ...p, address: e.target.value }))} placeholder="Address *"
        className={inputCls + ' sm:col-span-2 resize-none'} rows={2}
      />
      <textarea
        value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} placeholder="Description (optional)"
        className={inputCls + ' sm:col-span-2 resize-none'} rows={2}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Bulk import */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <ImagePlus size={18} className="text-blue-500" /> Bulk Import {label}s
        </h2>
        <p className="text-xs text-gray-500 mb-3">Upload a CSV to add many {label.toLowerCase()}s at once. Photos aren't included — add them per-{label.toLowerCase()} afterward.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Download CSV Template
          </button>
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? <><Loader2 size={13} className="animate-spin" /> Importing…</> : 'Import CSV'}
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
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icon size={18} className="text-blue-500" /> Add New {label}
        </h2>
        <FormFields f={form} setF={setForm} />
        <button
          onClick={() => createPlace.mutate()}
          disabled={!form.category || !form.name || !form.area || !form.address || !form.latitude || !form.longitude || createPlace.isPending}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700 transition-colors"
        >
          {createPlace.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : `Create ${label}`}
        </button>
      </div>

      {/* List */}
      <div>
        <h3 className="font-bold text-gray-700 mb-3 text-sm">Existing {label}s ({places?.length ?? 0})</h3>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={28} /></div>
        ) : !places?.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-500">No {label.toLowerCase()}s added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                {editing?.id === p.id ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                      <div className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <span>{icons[p.category] || (type === 'FOOD' ? '🍴' : '📍')}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          {uploadingId === p.id ? <Loader2 size={16} className="text-white animate-spin" /> : <ImagePlus size={16} className="text-white" />}
                        </div>
                        <input
                          type="file" accept="image/*" className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadImage.mutate({ id: p.id, file });
                            e.target.value = '';
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{p.images?.[0] ? 'Change photo' : 'Add photo'}</span>
                    </label>
                    <FormFields f={editForm} setF={setEditForm} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updatePlace.mutate(p.id)}
                        disabled={updatePlace.isPending}
                        className="px-4 py-2 rounded-xl text-white font-bold text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatePlace.isPending ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border-2 border-gray-200 text-xs font-semibold text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <label className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden cursor-pointer bg-gray-50 border border-gray-100">
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="56px" />
                      ) : (
                        <span>{icons[p.category] || (type === 'FOOD' ? '🍴' : '📍')}</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        {uploadingId === p.id ? <Loader2 size={16} className="text-white animate-spin" /> : <ImagePlus size={16} className="text-white" />}
                      </div>
                      <input
                        ref={(el) => { fileRefs.current[p.id] = el; }}
                        type="file" accept="image/*" className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage.mutate({ id: p.id, file });
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {icons[p.category]} {labels[p.category] || p.category}
                        </span>
                        {p.isSuspended && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">Suspended</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{p.area}, {p.city}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.phone} · {p.openingTime}–{p.closingTime}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (p.isSuspended) {
                            suspendPlace.mutate({ id: p.id, suspended: false });
                          } else {
                            const reason = window.prompt(`Reason for suspending "${p.name}"?`, 'Removed by admin.');
                            if (reason !== null) suspendPlace.mutate({ id: p.id, suspended: true, reason });
                          }
                        }}
                        disabled={suspendPlace.isPending}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          p.isSuspended
                            ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                        }`}
                      >
                        {p.isSuspended ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {p.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) deletePlace.mutate(p.id); }}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

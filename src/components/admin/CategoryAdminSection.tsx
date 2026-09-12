'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Tags, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface CategoryRow {
  id: string;
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM = { key: '', label: '', icon: '🏪', sortOrder: '' };

export default function CategoryAdminSection() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/api/categories/admin/all')).data as CategoryRow[],
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
  };

  const createCategory = useMutation({
    mutationFn: async () => api.post('/api/categories/admin', {
      key: form.key,
      label: form.label,
      icon: form.icon || undefined,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
    }),
    onSuccess: () => {
      toast.success('Category created.');
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create.'),
  });

  const updateCategory = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/categories/admin/${id}`, {
      key: editForm.key,
      label: editForm.label,
      icon: editForm.icon || undefined,
      sortOrder: editForm.sortOrder === '' ? undefined : Number(editForm.sortOrder),
    }),
    onSuccess: () => {
      toast.success('Saved.');
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save.'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/categories/admin/${id}`, { isActive }),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed.'),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/categories/admin/${id}`),
    onSuccess: () => { toast.success('Deleted.'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete.'),
  });

  const startEdit = (c: CategoryRow) => {
    setEditing(c);
    setEditForm({ key: c.key, label: c.label, icon: c.icon, sortOrder: String(c.sortOrder) });
  };

  const inputCls = 'px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800';

  return (
    <div className="space-y-5">
      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tags size={18} className="text-blue-500" /> Add New Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={form.icon}
            onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
            placeholder="Icon (emoji)"
            className={inputCls}
            maxLength={4}
          />
          <input
            value={form.key}
            onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))}
            placeholder="Key * (e.g. STATIONERY)"
            className={inputCls}
          />
          <input
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
            placeholder="Display label *"
            className={inputCls}
          />
          <input
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value.replace(/\D/g, '') }))}
            placeholder="Sort order (optional)"
            className={inputCls}
          />
        </div>
        <button
          onClick={() => createCategory.mutate()}
          disabled={!form.key.trim() || !form.label.trim() || createCategory.isPending}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700 transition-colors"
        >
          {createCategory.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Category'}
        </button>
      </div>

      {/* List */}
      <div>
        <h3 className="font-bold text-gray-700 mb-3 text-sm">Categories ({categories?.length ?? 0})</h3>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={28} /></div>
        ) : !categories?.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-500">No categories yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${!c.isActive ? 'opacity-60' : ''}`}>
                {editing?.id === c.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input value={editForm.icon} onChange={(e) => setEditForm((p) => ({ ...p, icon: e.target.value }))} placeholder="Icon" className={inputCls} maxLength={4} />
                      <input value={editForm.key} onChange={(e) => setEditForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))} placeholder="Key" className={inputCls} />
                      <input value={editForm.label} onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label" className={inputCls} />
                      <input value={editForm.sortOrder} onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: e.target.value.replace(/\D/g, '') }))} placeholder="Sort order" className={inputCls} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCategory.mutate(c.id)}
                        disabled={updateCategory.isPending || !editForm.key.trim() || !editForm.label.trim()}
                        className="px-4 py-2 rounded-xl text-white font-bold text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {updateCategory.isPending ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border-2 border-gray-200 text-xs font-semibold text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gray-50 border border-gray-100">
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{c.label}</p>
                        <span className="text-xs font-mono text-gray-400">{c.key}</span>
                        {!c.isActive && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-gray-400">Hidden</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Sort order {c.sortOrder}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive.mutate({ id: c.id, isActive: !c.isActive })}
                        disabled={toggleActive.isPending}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        title={c.isActive ? 'Hide from pickers' : 'Show in pickers'}
                      >
                        {c.isActive ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => startEdit(c)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${c.label}"? Shops using it must be reassigned first.`)) deleteCategory.mutate(c.id); }}
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

import React, {useEffect, useState} from 'react';
import {WordPack} from '../../../core/types.js';
import type {ApiErrorCode} from '../../../server/protocol.js';
import {useI18n} from '../../i18n/index.js';

interface AdminDeckEditorProps {
  onClose: () => void;
}

export const AdminDeckEditor: React.FC<AdminDeckEditorProps> = ({ onClose }) => {
  const { t } = useI18n();

  /** Texto traducido de un error devuelto por la API (mensaje crudo solo si no trae código). */
  const serverError = (data: { error?: string; code?: ApiErrorCode } | undefined, fallback: string) =>
    data?.code ? (t.errors[data.code] ?? t.errors.INTERNAL) : data?.error || fallback;

  const [adminToken, setAdminToken] = useState(() => {
    return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('expresion_admin_token')) || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [packs, setPacks] = useState<WordPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state for creating/editing pack
  const [showModal, setShowModal] = useState(false);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWordsText, setFormWordsText] = useState('');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formPriceTier, setFormPriceTier] = useState<'FREE' | 'TIER_1' | 'TIER_2'>('FREE');

  const fetchAdminPacks = async (token = adminToken) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/packs', {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (res.status === 401) {
        setIsAuthenticated(false);
        setError(t.errors.UNAUTHORIZED);
      } else if (data.success && data.data) {
        setIsAuthenticated(true);
        setPacks(data.data);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('expresion_admin_token', token);
        }
      }
    } catch (e: any) {
      setError(e.message || t.admin.messages.connectionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchAdminPacks(adminToken);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken.trim()) return;
    fetchAdminPacks(adminToken.trim());
  };

  const handleOpenCreate = () => {
    setEditingPackId(null);
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormWordsText('');
    setFormIsPremium(false);
    setFormPriceTier('FREE');
    setShowModal(true);
  };

  const handleOpenEdit = (p: WordPack) => {
    setEditingPackId(p.id);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormDescription(p.description);
    setFormWordsText(p.words?.join(', ') || '');
    setFormIsPremium(p.isPremium);
    setFormPriceTier(p.priceTier || 'FREE');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.messages.confirmDelete(id))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/packs/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t.admin.messages.deleted);
        fetchAdminPacks();
      } else {
        setError(serverError(data, t.admin.messages.deleteFailed));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const words = formWordsText
      .split(/[\n,]+/)
      .map((w) => w.trim().toUpperCase())
      .filter((w) => w.length > 0);

    if (words.length < 5) {
      setError(t.admin.messages.tooFewWords);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory.trim(),
        description: formDescription.trim(),
        words,
        isPremium: formIsPremium,
        priceTier: formPriceTier,
      };

      let res;
      if (editingPackId) {
        res = await fetch(`/api/admin/packs/${editingPackId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/packs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(editingPackId ? t.admin.messages.updated : t.admin.messages.created);
        setShowModal(false);
        fetchAdminPacks();
      } else {
        setError(serverError(data, t.admin.messages.saveFailed));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/packs/export', {
        headers: { 'x-admin-token': adminToken },
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expresion-packs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      setError(t.admin.messages.exportFailed);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedPacks = JSON.parse(text);
      if (!Array.isArray(importedPacks)) {
        throw new Error(t.admin.messages.importNotArray);
      }

      const res = await fetch('/api/admin/packs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ packs: importedPacks, overwrite: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t.admin.messages.imported(data.data.imported));
        fetchAdminPacks();
      } else {
        setError(serverError(data, t.errors.INTERNAL));
      }
    } catch (e: any) {
      setError(t.admin.messages.importFailed(e.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-xl font-black text-amber-400 uppercase tracking-wide">
              {t.admin.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            title={t.common.close}
            aria-label={t.common.close}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">×</button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Login / Auth Form */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="max-w-sm mx-auto space-y-4 py-8">
            <div className="text-center text-sm text-slate-300">
              {t.admin.login.intro}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                {t.admin.login.tokenLabel}
              </label>
              <input
                type="password"
                required
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder={t.admin.login.tokenPlaceholder}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !adminToken.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              {loading ? t.admin.login.submitting : t.admin.login.submit}
            </button>
          </form>
        ) : (
          /* Main Admin Content */
          <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
              >
                <span>{t.admin.list.newPack}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExport}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs"
                >
                  {t.admin.importExport.exportJson}
                </button>
                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs cursor-pointer">
                  <span>{t.admin.importExport.importJson}</span>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>

            {/* Packs Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{t.admin.list.columns.name}</th>
                    <th className="px-4 py-3">{t.admin.list.columns.category}</th>
                    <th className="px-4 py-3 text-center">{t.admin.list.columns.words}</th>
                    <th className="px-4 py-3 text-center">{t.admin.list.columns.type}</th>
                    <th className="px-4 py-3 text-right">{t.admin.list.columns.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {packs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.category}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-amber-300">
                        {p.words?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.isPremium ? (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {p.priceTier || t.admin.list.premium}
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {t.admin.list.free}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                        >
                          {t.admin.list.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold"
                        >
                          {t.admin.list.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {packs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                        {t.admin.list.empty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Modal Create / Edit Pack */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-amber-400 uppercase">
                {editingPackId ? t.admin.form.editTitle : t.admin.form.createTitle}
              </h3>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{t.admin.form.name}</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t.admin.form.namePlaceholder}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t.admin.form.category}</label>
                    <input
                      type="text"
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder={t.admin.form.categoryPlaceholder}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t.admin.form.tier}</label>
                    <select
                      value={formPriceTier}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setFormPriceTier(val);
                        setFormIsPremium(val !== 'FREE');
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    >
                      <option value="FREE">{t.admin.form.tiers.FREE}</option>
                      <option value="TIER_1">{t.admin.form.tiers.TIER_1}</option>
                      <option value="TIER_2">{t.admin.form.tiers.TIER_2}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{t.admin.form.description}</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t.admin.form.descriptionPlaceholder}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {t.admin.form.words}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formWordsText}
                    onChange={(e) => setFormWordsText(e.target.value)}
                    placeholder={t.admin.form.wordsPlaceholder}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono uppercase"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    {loading ? t.admin.form.saving : t.admin.form.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

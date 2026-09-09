import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Eye, EyeOff, X,
  Newspaper, ImageOff, Search, Tag, Calendar,
} from 'lucide-react';
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../services/article.service';
import type { Article, ArticleFormData } from '../types/article';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const EMPTY_FORM: ArticleFormData = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  is_published: true,
  thumbnailFile: null,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function Articles() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem('token') ?? '';

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getArticles({ limit: 100, search: search || undefined });
      setItems(result.data);
      setImgErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data artikel');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setThumbPreview(null);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: Article) => {
    setEditing(item);
    setFormData({
      title: item.title,
      excerpt: item.excerpt ?? '',
      content: item.content ?? '',
      category: item.category ?? '',
      is_published: item.is_published,
      thumbnailFile: null,
    });
    setThumbPreview(item.thumbnail ? `${API_BASE_URL}${item.thumbnail}` : null);
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setThumbPreview(null);
    setFormErrors([]);
  };

  // ─── Form handlers ────────────────────────────────────────────────────────

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFormErrors(['Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)']);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(['Ukuran file maksimal 5MB']);
      return;
    }
    setFormData(prev => ({ ...prev, thumbnailFile: file }));
    setFormErrors([]);
    const reader = new FileReader();
    reader.onloadend = () => setThumbPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errs: string[] = [];
    if (!formData.title.trim()) errs.push('Judul artikel wajib diisi');
    if (!formData.content.trim()) errs.push('Konten artikel wajib diisi');
    if (errs.length) { setFormErrors(errs); return; }

    setSubmitting(true);
    try {
      if (editing) {
        await updateArticle(editing.id, formData, token);
      } else {
        await createArticle(formData, token);
      }
      closeModal();
      fetchItems();
    } catch (err) {
      if (err instanceof Error) {
        // axios error with response
        const axiosErr = err as { response?: { data?: { errors?: string[]; message?: string } } };
        const errData = axiosErr.response?.data;
        if (errData?.errors && Array.isArray(errData.errors)) {
          setFormErrors(errData.errors);
        } else {
          setFormErrors([errData?.message || err.message || 'Gagal menyimpan artikel']);
        }
      } else {
        setFormErrors(['Gagal menyimpan artikel']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle publish ───────────────────────────────────────────────────────

  const togglePublish = async (item: Article) => {
    try {
      await updateArticle(
        item.id,
        {
          title: item.title,
          excerpt: item.excerpt ?? '',
          content: item.content ?? '',
          category: item.category ?? '',
          is_published: !item.is_published,
        },
        token
      );
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteArticle(toDelete.id, token);
      setShowDeleteModal(false);
      setToDelete(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus artikel');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchItems} className="mt-2 text-sm text-red-700 underline">Coba lagi</button>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari artikel..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-3 py-2.5 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Add button */}
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Artikel
        </button>
      </div>

      {/* Article list — table-style card */}
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                {item.thumbnail && !imgErrors[item.id] ? (
                  <img
                    src={`${API_BASE_URL}${item.thumbnail}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-200">
                    {imgErrors[item.id]
                      ? <ImageOff className="w-8 h-8" />
                      : <Newspaper className="w-8 h-8" />
                    }
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    item.is_published
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                  {item.category && (
                    <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      {item.category}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>

                {item.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{item.excerpt}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                  {item.slug && (
                    <span className="font-mono truncate max-w-[200px]">/{item.slug}</span>
                  )}
                  {item.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.published_at)}
                    </span>
                  )}
                  {item.author_name && (
                    <span>oleh {item.author_name}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    item.is_published
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {item.is_published
                    ? <><EyeOff className="w-3.5 h-3.5" />Draft</>
                    : <><Eye className="w-3.5 h-3.5" />Publish</>
                  }
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-200"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setToDelete(item); setShowDeleteModal(true); }}
                  className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition border border-red-200"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Newspaper className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {search ? 'Tidak ada artikel ditemukan' : 'Belum ada artikel'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? `Tidak ada hasil untuk "${search}"` : 'Mulai dengan membuat artikel pertama'}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Buat Artikel Pertama
            </button>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? 'Edit Artikel' : 'Tambah Artikel'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition" aria-label="Tutup">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                    {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Artikel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInput}
                  required
                  maxLength={255}
                  placeholder="Masukkan judul artikel..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Slug akan digenerate otomatis dari judul</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInput}
                  maxLength={100}
                  placeholder="cth. Berita, Pengumuman, Kegiatan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ringkasan <span className="text-gray-400 font-normal">(excerpt)</span>
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInput}
                  rows={2}
                  placeholder="Ringkasan singkat yang tampil di list artikel..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Konten <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInput}
                  rows={10}
                  required
                  placeholder="Tulis konten artikel lengkap di sini..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y font-mono text-sm"
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Thumbnail
                  {editing && (
                    <span className="text-gray-400 font-normal ml-1">(kosongkan jika tidak diganti)</span>
                  )}
                </label>
                {thumbPreview && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 h-44">
                    <img src={thumbPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">Klik untuk upload</span> atau drag &amp; drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF — maks. 5MB</p>
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
              </div>

              {/* Published toggle */}
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleCheckbox}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${formData.is_published ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${formData.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {formData.is_published ? 'Publikasikan sekarang' : 'Simpan sebagai draft'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formData.is_published
                        ? 'Artikel akan langsung terlihat di halaman publik'
                        : 'Artikel tidak akan tampil di halaman publik'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Buat Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {showDeleteModal && toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Artikel</h3>
                <p className="text-sm text-gray-500 mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus artikel{' '}
              <span className="font-semibold text-gray-900">"{toDelete.title}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setToDelete(null); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

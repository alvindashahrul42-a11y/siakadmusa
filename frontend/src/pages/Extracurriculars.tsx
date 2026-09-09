import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Dumbbell, ImageOff } from 'lucide-react';
import {
  getExtracurriculars,
  createExtracurricular,
  updateExtracurricular,
  deleteExtracurricular,
} from '../services/extracurricular.service';
import type { Extracurricular, ExtracurricularFormData } from '../types/extracurricular';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const DEFAULT_FORM: ExtracurricularFormData = {
  name: '',
  imageFile: null,
  sort_order: 1,
  is_active: true,
};

export default function Extracurriculars() {
  const [items, setItems] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Extracurricular | null>(null);
  const [formData, setFormData] = useState<ExtracurricularFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Extracurricular | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem('token') ?? '';

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getExtracurriculars({ limit: 100 });
      setItems(result.data);
      setImageErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data ekstrakurikuler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ ...DEFAULT_FORM, sort_order: items.length + 1 });
    setImagePreview(null);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEditModal = (item: Extracurricular) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      imageFile: null,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setImagePreview(item.image ? `${API_BASE_URL}${item.image}` : null);
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImagePreview(null);
    setFormErrors([]);
  };

  // ─── Form handlers ────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormErrors(['Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)']);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(['Ukuran file maksimal 5MB']);
      return;
    }

    setFormData(prev => ({ ...prev, imageFile: file }));
    setFormErrors([]);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    if (!formData.name.trim()) {
      setFormErrors(['Nama ekstrakurikuler wajib diisi']);
      return;
    }
    if (!editingItem && !formData.imageFile) {
      setFormErrors(['Gambar ekstrakurikuler wajib diunggah']);
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateExtracurricular(editingItem.id, formData, token);
      } else {
        await createExtracurricular(formData, token);
      }
      closeModal();
      fetchItems();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan ekstrakurikuler';
      setFormErrors([msg]);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle active ────────────────────────────────────────────────────────

  const toggleActive = async (item: Extracurricular) => {
    try {
      await updateExtracurricular(
        item.id,
        {
          name: item.name,
          sort_order: item.sort_order,
          is_active: !item.is_active,
        },
        token
      );
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const openDeleteModal = (item: Extracurricular) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteExtracurricular(itemToDelete.id, token);
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus ekstrakurikuler');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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
        <button
          onClick={fetchItems}
          className="mt-3 text-sm text-red-700 underline hover:no-underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Tambah Ekstrakurikuler
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div
            key={item.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image */}
            <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {imageErrors[item.id] || !item.image ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageOff className="w-16 h-16 opacity-30 mb-2" />
                  <p className="text-sm">Gambar tidak tersedia</p>
                </div>
              ) : (
                <img
                  src={`${API_BASE_URL}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={() =>
                    setImageErrors(prev => ({ ...prev, [item.id]: true }))
                  }
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-lg">
                  #{item.sort_order}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                    item.is_active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-1">
                {item.name}
              </h3>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(item)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
                    item.is_active
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {item.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Aktifkan</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:shadow-md"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(item)}
                  className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-300 border border-red-200 hover:shadow-md"
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
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Dumbbell className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada ekstrakurikuler</h3>
          <p className="text-gray-500 mb-6">Mulai dengan menambahkan ekstrakurikuler pertama</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Ekstrakurikuler Pertama
          </button>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error list */}
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Ekstrakurikuler <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="cth. Pramuka, Basket, Karate"
                  maxLength={150}
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Gambar{' '}
                  {!editingItem && <span className="text-red-500">*</span>}
                  {editingItem && (
                    <span className="text-gray-400 font-normal ml-1">(kosongkan jika tidak diganti)</span>
                  )}
                </label>

                {/* Preview */}
                {imagePreview && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 h-40">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">Klik untuk upload</span>{' '}
                      atau drag &amp; drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF — maks. 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sort order & is_active (side by side) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                          formData.is_active ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                          formData.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formData.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2">
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
                  {submitting
                    ? 'Menyimpan...'
                    : editingItem
                    ? 'Simpan Perubahan'
                    : 'Tambah Ekstrakurikuler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Ekstrakurikuler</h3>
                <p className="text-sm text-gray-500 mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Apakah kamu yakin ingin menghapus ekstrakurikuler{' '}
              <span className="font-semibold text-gray-900">"{itemToDelete.name}"</span>?
              Gambar terkait juga akan dihapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
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

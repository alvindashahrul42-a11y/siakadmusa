import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Trophy } from 'lucide-react';

interface SchoolAchievement {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  student_name: string | null;
  achievement_date: string | null;
  image: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AchievementFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  student_name: string;
  achievement_date: string;
  sort_order: number;
  is_published: boolean;
  imageFile?: File | null;
}

const LEVELS = [
  'Internasional',
  'Nasional',
  'Provinsi',
  'Kabupaten/Kota',
  'Kecamatan',
  'Sekolah',
];

const LEVEL_COLORS: Record<string, string> = {
  Internasional: 'bg-purple-100 text-purple-700 border-purple-200',
  Nasional:      'bg-red-100 text-red-700 border-red-200',
  Provinsi:      'bg-orange-100 text-orange-700 border-orange-200',
  'Kabupaten/Kota': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Kecamatan:     'bg-blue-100 text-blue-700 border-blue-200',
  Sekolah:       'bg-green-100 text-green-700 border-green-200',
};

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const emptyForm = (): AchievementFormData => ({
  title: '',
  description: '',
  category: '',
  level: '',
  student_name: '',
  achievement_date: '',
  sort_order: 0,
  is_published: true,
  imageFile: null,
});

export default function SchoolAchievements() {
  const [achievements, setAchievements] = useState<SchoolAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SchoolAchievement | null>(null);
  const [formData, setFormData] = useState<AchievementFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAchievements(); }, []);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/school-achievements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setAchievements(result.data);
        setImageErrors({});
      } else {
        setError(result.message || 'Gagal memuat data prestasi');
      }
    } catch {
      setError('Gagal memuat data prestasi');
    } finally {
      setLoading(false);
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...emptyForm(), sort_order: achievements.length + 1 });
    setImagePreview(null);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (item: SchoolAchievement) => {
    setEditing(item);
    setFormData({
      title: item.title,
      description: item.description ?? '',
      category: item.category ?? '',
      level: item.level ?? '',
      student_name: item.student_name ?? '',
      achievement_date: item.achievement_date ? item.achievement_date.slice(0, 10) : '',
      sort_order: item.sort_order,
      is_published: item.is_published,
      imageFile: null,
    });
    setImagePreview(item.image ? `${API_BASE}${item.image}` : null);
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setImagePreview(null);
    setFormErrors([]);
  };

  // ─── Form handlers ────────────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFormErrors(['Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)']);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(['Ukuran file maksimal 5MB']);
      return;
    }

    setFormData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const url = editing
        ? `${API_BASE}/api/school-achievements/${editing.id}`
        : `${API_BASE}/api/school-achievements`;

      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('level', formData.level);
      fd.append('student_name', formData.student_name);
      fd.append('achievement_date', formData.achievement_date);
      fd.append('sort_order', formData.sort_order.toString());
      fd.append('is_published', formData.is_published.toString());
      if (formData.imageFile) fd.append('image', formData.imageFile);

      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      const result = await res.json();

      if (result.success) {
        closeModal();
        fetchAchievements();
      } else {
        setFormErrors(
          Array.isArray(result.error) ? result.error : [result.message || 'Gagal menyimpan data']
        );
      }
    } catch {
      setFormErrors(['Gagal menyimpan data. Silakan coba lagi.']);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle published ─────────────────────────────────────────────────────

  const togglePublished = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/school-achievements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ is_published: !current }),
      });
      const result = await res.json();
      if (result.success) fetchAchievements();
      else alert(result.message || 'Gagal mengubah status');
    } catch {
      alert('Gagal mengubah status');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/school-achievements/${toDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setShowDeleteModal(false);
        setToDelete(null);
        fetchAchievements();
      } else {
        alert(result.message || 'Gagal menghapus data');
      }
    } catch {
      alert('Gagal menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header action */}
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Tambah Prestasi
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-yellow-50 to-amber-100 overflow-hidden">
              {item.image && !imageErrors[item.id] ? (
                <img
                  src={`${API_BASE}${item.image}`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-yellow-300">
                  <Trophy className="w-20 h-20 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shadow backdrop-blur-sm border ${
                    item.is_published ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-500 text-white border-gray-500'
                  }`}
                >
                  {item.is_published ? 'Published' : 'Draft'}
                </span>
                {item.level && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow backdrop-blur-sm border ${LEVEL_COLORS[item.level] ?? 'bg-white text-gray-700 border-gray-200'}`}>
                    {item.level}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                {item.title}
              </h3>

              {item.category && (
                <span className="inline-block text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-0.5 mb-2">
                  {item.category}
                </span>
              )}

              {item.student_name && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Siswa:</span> {item.student_name}
                </p>
              )}

              {item.achievement_date && (
                <p className="text-xs text-gray-400 mb-2">{formatDate(item.achievement_date)}</p>
              )}

              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => togglePublished(item.id, item.is_published)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
                    item.is_published
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {item.is_published ? (
                    <><EyeOff className="w-4 h-4" /><span>Draft</span></>
                  ) : (
                    <><Eye className="w-4 h-4" /><span>Publish</span></>
                  )}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300 border border-blue-200"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setToDelete(item.id); setShowDeleteModal(true); }}
                  className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-300 border border-red-200"
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
      {achievements.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-dashed border-yellow-200">
          <div className="text-7xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada prestasi</h3>
          <p className="text-gray-600 mb-6">Mulai tambahkan prestasi sekolah Anda</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Prestasi Pertama
          </button>
        </div>
      )}

      {/* ── Modal Create / Edit ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? 'Edit Prestasi' : 'Tambah Prestasi'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Errors */}
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
                  Judul Prestasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInput}
                  required
                  maxLength={200}
                  placeholder="Masukkan judul prestasi"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
                />
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInput}
                    maxLength={100}
                    placeholder="cth. Akademik, Olahraga, Seni"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tingkat</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition bg-white"
                  >
                    <option value="">-- Pilih Tingkat --</option>
                    {LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student name & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Siswa</label>
                  <input
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleInput}
                    maxLength={150}
                    placeholder="Nama siswa / tim"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Prestasi</label>
                  <input
                    type="date"
                    name="achievement_date"
                    value={formData.achievement_date}
                    onChange={handleInput}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInput}
                  rows={3}
                  placeholder="Deskripsi singkat tentang prestasi ini"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition resize-none"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Foto / Piala</label>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-44 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">JPEG, JPG, PNG, GIF, WEBP — Maks 5MB</p>
              </div>

              {/* Sort order & Published */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Urutan Tampil</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInput}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
                  />
                </div>
                <div className="pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleCheckbox}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="text-sm font-semibold text-gray-700">Publikasikan</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : editing ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Delete ────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium mb-1">Yakin ingin menghapus prestasi ini?</p>
                  <p className="text-sm text-gray-500">Data yang sudah dihapus tidak dapat dikembalikan.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setToDelete(null); }}
                disabled={deleting}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
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

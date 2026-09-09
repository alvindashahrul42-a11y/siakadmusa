import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroSlideFormData {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  sort_order: number;
  is_active: boolean;
  imageFile?: File | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function HeroSlides() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<HeroSlideFormData>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    sort_order: 1,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  const fetchHeroSlides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/hero-slides`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setHeroSlides(result.data);
        setImageErrors({}); // Reset image errors when new data loaded
      } else {
        setError(result.message || 'Failed to fetch hero slides');
      }
    } catch (err) {
      setError('Failed to fetch hero slides');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      sort_order: heroSlides.length + 1,
      is_active: true,
      imageFile: null,
    });
    setImagePreview(null);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      image: slide.image,
      sort_order: slide.sort_order,
      is_active: slide.is_active,
      imageFile: null,
    });
    setImagePreview(`${API_BASE}${slide.image}`);
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlide(null);
    setImagePreview(null);
    setFormErrors([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors(['Only image files are allowed (jpeg, jpg, png, gif, webp)']);
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(['File size must not exceed 5MB']);
        return;
      }

      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const url = editingSlide
        ? `${API_URL}/hero-slides/${editingSlide.id}`
        : `${API_URL}/hero-slides`;

      const method = editingSlide ? 'PUT' : 'POST';

      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subtitle', formData.subtitle);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('sort_order', formData.sort_order.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      // Add image file if selected
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        fetchHeroSlides();
      } else {
        if (Array.isArray(result.error)) {
          setFormErrors(result.error);
        } else {
          setFormErrors([result.message || 'Failed to save hero slide']);
        }
      }
    } catch (err) {
      setFormErrors(['Failed to save hero slide. Please try again.']);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/hero-slides/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchHeroSlides(); // Refresh data
      } else {
        alert(result.message || 'Failed to update hero slide');
      }
    } catch (err) {
      alert('Failed to update hero slide');
      console.error(err);
    }
  };

  const deleteHeroSlide = async (id: string) => {
    setSlideToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!slideToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/hero-slides/${slideToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setShowDeleteModal(false);
        setSlideToDelete(null);
        fetchHeroSlides(); // Refresh data
      } else {
        alert(result.message || 'Failed to delete hero slide');
      }
    } catch (err) {
      alert('Failed to delete hero slide');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSlideToDelete(null);
  };

  const handleImageError = (slideId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [slideId]: true
    }));
  };

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

  return (
    <div>
      {/* Add Button */}
      <div className="flex justify-end mb-6">
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Tambah Hero Slide
        </button>
      </div>

      {/* Hero Slides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {heroSlides.map((slide) => (
          <div key={slide.id} className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* Image */}
            <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {imageErrors[slide.id] ? (
                // Placeholder when image failed to load
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-20 h-20 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium">Image not found</p>
                  </div>
                </div>
              ) : (
                <img
                  src={`${API_BASE}${slide.image}`}
                  alt={slide.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={() => handleImageError(slide.id)}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-lg">
                  Order {slide.sort_order}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                    slide.is_active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {slide.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{slide.title}</h3>
              <p className="text-sm text-blue-600 font-medium mb-3 line-clamp-1">{slide.subtitle}</p>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{slide.description}</p>

              {/* Actions */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(slide.id, slide.is_active)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
                    slide.is_active
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {slide.is_active ? (
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
                  onClick={() => openEditModal(slide)}
                  className="p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:shadow-md"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteHeroSlide(slide.id)}
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

      {/* Empty State */}
      {heroSlides.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-7xl mb-4">🎬</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada hero slide</h3>
          <p className="text-gray-600 mb-6">Mulai dengan menambahkan hero slide pertama Anda</p>
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Hero Slide Pertama
          </button>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSlide ? 'Edit Hero Slide' : 'Tambah Hero Slide'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Error Messages */}
              {formErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul hero slide"
                  required
                  maxLength={200}
                />
              </div>

              {/* Subtitle */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan subtitle"
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan deskripsi"
                />
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image <span className="text-red-500">*</span>
                </label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {/* File Input */}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!editingSlide && !imagePreview}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Allowed: JPEG, JPG, PNG, GIF, WEBP (Max: 5MB)
                </p>
              </div>

              {/* Sort Order */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Urutan tampilan slide (semakin kecil semakin pertama)
                </p>
              </div>

              {/* Is Active */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Aktifkan slide ini
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : editingSlide ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Konfirmasi Hapus
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">
                    Apakah Anda yakin ingin menghapus hero slide ini?
                  </p>
                  <p className="text-sm text-gray-600">
                    Data yang sudah dihapus tidak dapat dikembalikan.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={deleting}
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

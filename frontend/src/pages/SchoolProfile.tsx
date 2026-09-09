import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Building, Mail, Phone, Globe, MapPin } from 'lucide-react';
import logoSmk from '../assets/logo-smk.png';
import authService from '../services/auth.service';
import {
  getSchoolProfile,
  createSchoolProfile,
  updateSchoolProfile,
  deleteSchoolProfile
} from '../services/schoolProfile.service';
import type { SchoolProfile as SchoolProfileType, SchoolProfileFormData } from '../types/schoolProfile';

export default function SchoolProfile() {
  const [profile, setProfile] = useState<SchoolProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<SchoolProfileFormData>({
    school_name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    vision: '',
    mission: '',
    instagram: '',
    facebook: '',
    youtube: ''
  });

  useEffect(() => {
    fetchSchoolProfile();
  }, []);

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSchoolProfile();
      setProfile(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      if (msg.toLowerCase().includes('not found')) {
        setProfile(null);
        setError(null);
      } else {
        setProfile(null);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      school_name: '',
      tagline: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      vision: '',
      mission: '',
      instagram: '',
      facebook: '',
      youtube: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!profile) return;
    setFormData({
      school_name: profile.school_name,
      tagline: profile.tagline || '',
      description: profile.description || '',
      address: profile.address || '',
      phone: profile.phone || '',
      email: profile.email || '',
      website: profile.website || '',
      vision: profile.vision || '',
      mission: profile.mission || '',
      instagram: profile.instagram || '',
      facebook: profile.facebook || '',
      youtube: profile.youtube || ''
    });
    setLogoFile(null);
    if (profile.logo) {
      setLogoPreview(`http://localhost:5000${profile.logo}`);
    } else {
      setLogoPreview(null);
    }
    setFormErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setLogoFile(null);
    setLogoPreview(null);
    setFormErrors([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors(['Only image files are allowed (jpeg, jpg, png, gif, webp)']);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(['File size must not exceed 5MB']);
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    const token = authService.getToken();
    if (!token) {
      setFormErrors(['Unauthorized. Please login again.']);
      setSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        logo: logoFile
      };

      if (profile) {
        await updateSchoolProfile(profile.id, dataToSubmit, token);
      } else {
        await createSchoolProfile(dataToSubmit, token);
      }

      closeModal();
      fetchSchoolProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setFormErrors([errorMessage]);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!profile) return;

    const token = authService.getToken();
    if (!token) return;

    setDeleting(true);
    try {
      await deleteSchoolProfile(profile.id, token);
      setProfile(null);
      setShowDeleteModal(false);
      fetchSchoolProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {profile && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
          >
            <Edit className="w-5 h-5" />
            Edit Profil
          </button>
          <button
            onClick={openDeleteModal}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
          >
            <Trash2 className="w-5 h-5" />
            Hapus
          </button>
        </div>
      )}

      {!profile ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-7xl mb-4">🏫</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada profil sekolah</h3>
          <p className="text-gray-600 mb-6">Mulai dengan menambahkan profil sekolah</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Profil Sekolah
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex justify-center border-b border-gray-200">
            <img
              src={logoSmk}
              alt="School logo"
              className="h-32 w-32 object-contain"
            />
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Nama Sekolah</h3>
                    <p className="text-2xl font-bold text-gray-900">{profile.school_name}</p>
                  </div>
                </div>
              </div>

              {profile.tagline && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tagline</h3>
                  <p className="text-lg text-blue-600 font-medium">{profile.tagline}</p>
                </div>
              )}

              {profile.description && (
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Deskripsi</h3>
                  <p className="text-gray-900 whitespace-pre-line leading-relaxed">{profile.description}</p>
                </div>
              )}

              <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Informasi Kontak</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Alamat</h4>
                        <p className="text-gray-900">{profile.address}</p>
                      </div>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Telepon</h4>
                        <p className="text-gray-900">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Email</h4>
                        <p className="text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                  )}

                  {profile.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Website</h4>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vision & Mission - Framed on wall style */}
              {(profile.vision || profile.mission) && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Visi &amp; Misi</h3>

                  {/* Wall background */}
                  <div className="rounded-2xl p-8 md:p-12"
                    style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #d1c7b880 39px, #d1c7b880 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #d1c7b880 39px, #d1c7b880 40px), linear-gradient(135deg, #e8dece 0%, #d6c9b5 50%, #c8b89a 100%)' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                      {/* Bingkai Visi */}
                      {profile.vision && (
                        <div className="relative flex flex-col items-center pt-8">
                          {/* Paku */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-md border border-gray-400" />
                            <div className="w-1 h-1 bg-gray-500 rounded-full" />
                          </div>
                          {/* Tali */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10" style={{ width: 0, height: 0 }}>
                            <svg width="80" height="20" viewBox="0 0 80 20" className="absolute -translate-x-1/2" style={{ top: 0 }}>
                              <path d="M40 0 Q10 18 0 20" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                              <path d="M40 0 Q70 18 80 20" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                          </div>

                          {/* Frame kayu */}
                          <div
                            className="-rotate-1 hover:rotate-0 transition-transform duration-500 cursor-default"
                            style={{ filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.45))' }}
                          >
                            {/* Lapisan terluar — bingkai kayu gelap */}
                            <div style={{ background: 'linear-gradient(145deg, #6b4c2a, #3d2b1f, #5c3d20, #3d2b1f)', padding: '14px', borderRadius: '2px' }}>
                              {/* Ornamen sudut dalam */}
                              <div style={{ background: 'linear-gradient(145deg, #c49a4a, #8B6914, #c49a4a)', padding: '4px', borderRadius: '1px' }}>
                                {/* Mat putih */}
                                <div style={{ background: '#fafaf8', padding: '20px', borderRadius: '1px' }}>
                                  {/* Konten */}
                                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)', minHeight: '180px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Ornamen atas */}
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="h-px w-8 bg-blue-300" />
                                      <div className="w-2 h-2 rotate-45 bg-blue-400" />
                                      <h4 className="text-xs font-bold text-blue-900 tracking-[0.3em] px-2">VISI</h4>
                                      <div className="w-2 h-2 rotate-45 bg-blue-400" />
                                      <div className="h-px w-8 bg-blue-300" />
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm text-center">
                                      {profile.vision}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bingkai Misi */}
                      {profile.mission && (
                        <div className="relative flex flex-col items-center pt-8">
                          {/* Paku */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-md border border-gray-400" />
                            <div className="w-1 h-1 bg-gray-500 rounded-full" />
                          </div>
                          {/* Tali */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10" style={{ width: 0, height: 0 }}>
                            <svg width="80" height="20" viewBox="0 0 80 20" className="absolute -translate-x-1/2" style={{ top: 0 }}>
                              <path d="M40 0 Q10 18 0 20" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                              <path d="M40 0 Q70 18 80 20" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                          </div>

                          {/* Frame kayu */}
                          <div
                            className="rotate-1 hover:rotate-0 transition-transform duration-500 cursor-default"
                            style={{ filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.45))' }}
                          >
                            {/* Lapisan terluar — bingkai kayu gelap */}
                            <div style={{ background: 'linear-gradient(145deg, #6b4c2a, #3d2b1f, #5c3d20, #3d2b1f)', padding: '14px', borderRadius: '2px' }}>
                              {/* Ornamen sudut dalam */}
                              <div style={{ background: 'linear-gradient(145deg, #c49a4a, #8B6914, #c49a4a)', padding: '4px', borderRadius: '1px' }}>
                                {/* Mat putih */}
                                <div style={{ background: '#fafaf8', padding: '20px', borderRadius: '1px' }}>
                                  {/* Konten */}
                                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', minHeight: '180px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Ornamen atas */}
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="h-px w-8 bg-green-300" />
                                      <div className="w-2 h-2 rotate-45 bg-green-500" />
                                      <h4 className="text-xs font-bold text-green-900 tracking-[0.3em] px-2">MISI</h4>
                                      <div className="w-2 h-2 rotate-45 bg-green-500" />
                                      <div className="h-px w-8 bg-green-300" />
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm text-center">
                                      {profile.mission}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {(profile.instagram || profile.facebook || profile.youtube) && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Media Sosial</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.instagram && (
                      <a
                        href={profile.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram
                      </a>
                    )}
                    {profile.facebook && (
                      <a
                        href={profile.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </a>
                    )}
                    {profile.youtube && (
                      <a
                        href={profile.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {profile ? 'Edit Profil Sekolah' : 'Tambah Profil Sekolah'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              {formErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Sekolah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama sekolah"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan tagline"
                    maxLength={255}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logo
                  </label>

                  {logoPreview && (
                    <div className="mb-3">
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="h-32 w-32 object-contain border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed: JPEG, JPG, PNG, GIF, WEBP (Max: 5MB)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan deskripsi"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan alamat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan telepon"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan email"
                    maxLength={150}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.sekolah.sch.id"
                    maxLength={255}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Visi
                  </label>
                  <textarea
                    name="vision"
                    value={formData.vision}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan visi sekolah"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Misi
                  </label>
                  <textarea
                    name="mission"
                    value={formData.mission}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan misi sekolah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://instagram.com/username"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://facebook.com/pagename"
                    maxLength={255}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://youtube.com/@channelname"
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
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
                  {submitting ? 'Menyimpan...' : profile ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Konfirmasi Hapus
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">
                    Apakah Anda yakin ingin menghapus profil sekolah ini?
                  </p>
                  <p className="text-sm text-gray-600">
                    Data yang sudah dihapus tidak dapat dikembalikan.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
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
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';import Hero from '../components/Hero';
import logoSmk from '../assets/logo-smk.png';
import { getSchoolProfile } from '../services/schoolProfile.service';
import type { SchoolProfile } from '../types/schoolProfile';
import { getFacilities } from '../services/facility.service';
import type { SchoolFacility } from '../types/facility';
import FacilitiesCarousel from '../components/FacilitiesCarousel';
import { getExtracurriculars } from '../services/extracurricular.service';
import type { Extracurricular } from '../types/extracurricular';
import ExtracurricularsCarousel from '../components/ExtracurricularsCarousel';
import { getActivities } from '../services/schoolActivity.service';
import type { SchoolActivity } from '../types/schoolActivity';
import { getAchievements } from '../services/schoolAchievement.service';
import type { SchoolAchievement } from '../types/schoolAchievement';
import { getArticles } from '../services/article.service';
import type { Article } from '../types/article';
import { getPrograms } from '../services/schoolProgram.service';
import type { SchoolProgram } from '../types/schoolProgram';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/** Format tanggal ke lokal Indonesia */
function formatActivityDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Section kegiatan sekolah dari API */
function SchoolActivitiesSection({
  activities,
  activitiesLoading,
  apiBaseUrl,
}: {
  activities: SchoolActivity[];
  activitiesLoading: boolean;
  apiBaseUrl: string;
}) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <section id="kegiatan" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Kegiatan Sekolah</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Berbagai kegiatan yang mengembangkan potensi dan karakter siswa
          </p>
          <div className="h-1.5 w-24 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(to right, #2E2D8F, #F5C518)' }} />
        </div>

        {activitiesLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2E2D8F' }} />
            <p className="mt-4 text-gray-500">Memuat kegiatan...</p>
          </div>
        )}

        {!activitiesLoading && activities.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📅</div>
            <p>Informasi kegiatan belum tersedia</p>
          </div>
        )}

        {!activitiesLoading && activities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:-translate-y-2"
                style={{ '--tw-border-opacity': '1' } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E2D8F')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef0ff, #dde0ff)' }}>
                  {!imgErrors[activity.id] && activity.image ? (
                    <img
                      src={`${apiBaseUrl}${activity.image}`}
                      alt={activity.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => setImgErrors(prev => ({ ...prev, [activity.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-20">📅</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {activity.activity_date && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full shadow" style={{ color: '#2E2D8F' }}>
                        📅 {formatActivityDate(activity.activity_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 transition-colors group-hover:text-[#2E2D8F]">
                    {activity.title}
                  </h3>
                  {activity.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  Internasional: 'from-purple-500 to-purple-600',
  Nasional:      'from-red-500 to-red-600',
  Provinsi:      'from-orange-500 to-orange-600',
  'Kabupaten/Kota': 'from-yellow-500 to-yellow-600',
  Kecamatan:     'from-blue-500 to-blue-600',
  Sekolah:       'from-green-500 to-green-600',
};

/** Section prestasi sekolah dari API */
function SchoolAchievementsSection({
  achievements,
  achievementsLoading,
  apiBaseUrl,
}: {
  achievements: SchoolAchievement[];
  achievementsLoading: boolean;
  apiBaseUrl: string;
}) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <section
      id="prestasi"
      className="py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1E1D6F 0%, #2E2D8F 50%, #3D3CAA 100%)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5C518' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gold top border accent */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Prestasi Sekolah</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#F5C518' }}>
            Membanggakan dengan berbagai pencapaian di tingkat nasional dan internasional
          </p>
          <div className="h-1.5 w-24 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800)' }} />
        </div>

        {achievementsLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#F5C518' }} />
            <p className="mt-4" style={{ color: '#F5C518' }}>Memuat prestasi...</p>
          </div>
        )}

        {!achievementsLoading && achievements.length === 0 && (
          <div className="text-center py-12" style={{ color: 'rgba(245,197,24,0.7)' }}>
            <div className="text-5xl mb-4">🏆</div>
            <p>Informasi prestasi belum tersedia</p>
          </div>
        )}

        {!achievementsLoading && achievements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {achievements.map((item, idx) => (
              <div
                key={item.id}
                className="group bg-white p-0 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 transform hover:-translate-y-3"
                style={{ borderColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#F5C518')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
              >
                {/* Image or Trophy placeholder */}
                <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef0ff, #dde0ff)' }}>
                  {item.image && !imgErrors[item.id] ? (
                    <img
                      src={`${apiBaseUrl}${item.image}`}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative inline-block">
                        <span className="text-7xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 block">
                          🏆
                        </span>
                        <div className="absolute -top-2 -right-2 w-7 h-7 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg" style={{ background: '#F5C518' }}>
                          {idx + 1}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Level badge */}
                  {item.level && (
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block bg-gradient-to-r ${LEVEL_COLORS[item.level] ?? 'from-gray-500 to-gray-600'} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
                        {item.level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                  {item.category && (
                    <span className="inline-block text-xs font-semibold rounded-full px-3 py-1 mb-3" style={{ color: '#2E2D8F', background: '#eef0ff', border: '1px solid #c7c7f0' }}>
                      {item.category}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight transition-colors line-clamp-2 group-hover:text-[#2E2D8F]">
                    {item.title}
                  </h3>
                  {item.student_name && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Oleh:</span> {item.student_name}
                    </p>
                  )}
                  {item.achievement_date && (
                    <p className="text-xs text-gray-400">
                      {new Date(item.achievement_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gold bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
    </section>
  );
}

/** Section artikel & berita dari API */
function ArticlesSection({
  articles,
  articlesLoading,
  apiBaseUrl,
}: {
  articles: Article[];
  articlesLoading: boolean;
  apiBaseUrl: string;
}) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  return (
    <section id="artikel" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Artikel &amp; Berita</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Informasi terkini seputar kegiatan dan perkembangan sekolah
          </p>
          <div className="h-1.5 w-24 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(to right, #2E2D8F, #F5C518)' }} />
        </div>

        {articlesLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2E2D8F' }} />
            <p className="mt-4 text-gray-500">Memuat artikel...</p>
          </div>
        )}

        {!articlesLoading && articles.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📰</div>
            <p>Belum ada artikel yang dipublikasikan</p>
          </div>
        )}

        {!articlesLoading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {articles.map(article => (
              <div
                key={article.id}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:-translate-y-2"
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E2D8F')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              >
                {/* Thumbnail */}
                <div
                  className="relative h-56 overflow-hidden cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #eef0ff, #dde0ff)' }}
                  onClick={() => navigate(`/artikel/${article.slug}`)}
                >
                  {article.thumbnail && !imgErrors[article.id] ? (
                    <img
                      src={`${apiBaseUrl}${article.thumbnail}`}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => setImgErrors(prev => ({ ...prev, [article.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-20">📰</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ background: '#2E2D8F' }}>
                      📰 Artikel
                    </span>
                    {article.category && (
                      <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ color: '#2E2D8F' }}>
                        {article.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {article.published_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(article.published_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </span>
                      {article.author_name && (
                        <span className="text-gray-300">•</span>
                      )}
                      {article.author_name && (
                        <span>{article.author_name}</span>
                      )}
                    </div>
                  )}

                  <h3
                    className="font-bold text-gray-900 mb-3 text-lg leading-tight transition-colors line-clamp-2 cursor-pointer hover:text-[#2E2D8F] group-hover:text-[#2E2D8F]"
                    onClick={() => navigate(`/artikel/${article.slug}`)}
                  >
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  <button
                    onClick={() => navigate(`/artikel/${article.slug}`)}
                    className="inline-flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all cursor-pointer"
                    style={{ color: '#2E2D8F' }}
                  >
                    <span>Baca Selengkapnya</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Section program unggulan — card dengan gambar dari API */
function ProgramCard({
  program,
  apiBaseUrl,
}: {
  program: SchoolProgram;
  apiBaseUrl: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 transform hover:-translate-y-2 overflow-hidden"
      style={{ borderColor: '#eef0ff' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E2D8F')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#eef0ff')}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef0ff, #dde0ff)' }}>
        {program.image && !imgError ? (
          <img
            src={`${apiBaseUrl}${program.image}`}
            alt={program.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">📚</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3 text-gray-900 transition-colors line-clamp-2 group-hover:text-[#2E2D8F]">
          {program.name}
        </h3>
        {program.description && (
          <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">
            {program.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Facilities state
  const [facilities, setFacilities] = useState<SchoolFacility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  // Extracurriculars state
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [extracurricularsLoading, setExtracurricularsLoading] = useState(true);

  // Activities state
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState<SchoolAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  // Articles state
  const [articleList, setArticleList] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Programs state
  const [programs, setPrograms] = useState<SchoolProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch school profile from API
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        setLoading(true);
        const data = await getSchoolProfile();
        setSchoolProfile(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching school profile:', err);
        setError('Gagal memuat profil sekolah');
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolProfile();
  }, []);

  // Fetch facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setFacilitiesLoading(true);
        const result = await getFacilities({ is_active: true, limit: 100 });
        setFacilities(result.data);
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setFacilitiesLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  // Fetch extracurriculars from API
  useEffect(() => {
    const fetchExtracurriculars = async () => {
      try {
        setExtracurricularsLoading(true);
        const result = await getExtracurriculars({ is_active: true, limit: 100 });
        setExtracurriculars(result.data);
      } catch (err) {
        console.error('Error fetching extracurriculars:', err);
      } finally {
        setExtracurricularsLoading(false);
      }
    };
    fetchExtracurriculars();
  }, []);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const result = await getActivities({ is_published: true, limit: 6 });
        setActivities(result.data);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Fetch achievements from API
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setAchievementsLoading(true);
        const result = await getAchievements({ is_published: true, limit: 6 });
        setAchievements(result.data);
      } catch (err) {
        console.error('Error fetching achievements:', err);
      } finally {
        setAchievementsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        const result = await getArticles({ is_published: true, limit: 6 });
        setArticleList(result.data);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setArticlesLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Fetch programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setProgramsLoading(true);
        const result = await getPrograms({ is_active: true, limit: 100 });
        setPrograms(result.data);
      } catch (err) {
        console.error('Error fetching programs:', err);
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#f5f6ff' }}>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'shadow-lg border-b' : ''
        }`}
        style={
          scrolled
            ? { background: '#ffffff', borderColor: '#e0e0f0' }
            : { background: 'transparent' }
        }
      >
        {/* Gold top strip when scrolled */}
        {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
        )}
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <img
                src={logoSmk}
                alt={schoolProfile?.school_name || "Logo Sekolah"}
                className="w-12 h-12 object-contain rounded-lg shadow-lg"
              />
              <div>
                <h1
                  className="text-xl font-bold leading-tight transition-colors duration-300"
                  style={{ color: scrolled ? '#1E1D6F' : 'white', textShadow: scrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.4)' }}
                >
                  {schoolProfile?.school_name || "SMK Muhammadiyah Sempor"}
                </h1>
                <p
                  className="text-xs transition-colors duration-300"
                  style={{ color: scrolled ? '#6b7280' : 'rgba(255,255,255,0.9)', textShadow: scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)' }}
                >
                  {schoolProfile?.tagline || "Excellent in Taqwa, Science, and Professional"}
                </p>
              </div>
            </div>

            {/* Navigation Menu - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Beranda',   href: '#beranda'  },
                { label: 'Profil',    href: '#profil'   },
                { label: 'Program',   href: '#program'  },
                { label: 'Prestasi',  href: '#prestasi' },
                { label: 'Kegiatan', href: '#kegiatan' },
                { label: 'Artikel',   href: '#artikel'  },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="font-medium transition-colors duration-300"
                  style={{ color: scrolled ? '#374151' : 'white', textShadow: scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F5C518')}
                  onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#374151' : 'white')}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* CTA Button (desktop only) + Mobile Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="hidden md:flex group items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 font-semibold"
                style={
                  scrolled
                    ? { background: 'linear-gradient(to right, #2E2D8F, #1E1D6F)', color: 'white' }
                    : { background: 'rgba(255,255,255,0.9)', color: '#2E2D8F', backdropFilter: 'blur(4px)' }
                }
                onMouseEnter={e => {
                  if (scrolled) {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to right, #1E1D6F, #0f0e50)';
                  } else {
                    (e.currentTarget as HTMLElement).style.background = '#F5C518';
                    (e.currentTarget as HTMLElement).style.color = '#1E1D6F';
                  }
                }}
                onMouseLeave={e => {
                  if (scrolled) {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to right, #2E2D8F, #1E1D6F)';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                  } else {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
                    (e.currentTarget as HTMLElement).style.color = '#2E2D8F';
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Daftar</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                className="md:hidden p-2 rounded-lg transition-colors duration-300"
                style={{ color: scrolled ? '#374151' : 'white' }}
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  /* X icon when open */
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Hamburger icon when closed */
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: scrolled ? '#ffffff' : 'rgba(30,29,111,0.97)',
              borderColor: scrolled ? '#e0e0f0' : 'rgba(245,197,24,0.2)',
            }}
          >
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {[
                { label: 'Beranda',   href: '#beranda'  },
                { label: 'Profil',    href: '#profil'   },
                { label: 'Program',   href: '#program'  },
                { label: 'Prestasi',  href: '#prestasi' },
                { label: 'Kegiatan', href: '#kegiatan' },
                { label: 'Artikel',   href: '#artikel'  },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                  style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.9)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#F5C518';
                    (e.currentTarget as HTMLElement).style.background = scrolled ? '#f5f6ff' : 'rgba(245,197,24,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.9)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}

              {/* Tombol Daftar di mobile */}
              <div className="pt-2 pb-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  style={{ background: 'linear-gradient(to right, #F5C518, #D4A800)', color: '#1E1D6F' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Daftar Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 1. Hero Slides - FROM API */}
      <Hero />

      {/* 2. School Profile - FROM API */}
      <section
        id="profil"
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1D6F 0%, #2E2D8F 60%, #3D3CAA 100%)' }}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#F5C518 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Gold top border */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            {!schoolProfile && (
              <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full shadow-sm" style={{ background: 'rgba(245,197,24,0.15)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.3)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F5C518' }}></span>
                {loading ? 'Loading...' : 'Coming Soon'}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">Profil Sekolah</h2>
            <div className="h-1.5 w-24 rounded-full mx-auto" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800)' }}></div>
          </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#F5C518' }}></div>
                <p className="mt-4 text-white/70">Memuat profil sekolah...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="font-semibold mb-2" style={{ color: '#F5C518' }}>{error}</p>
                <p className="text-white/60 text-sm">Silakan coba lagi nanti</p>
              </div>
            ) : schoolProfile ? (
              <div className="relative overflow-hidden">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-white/20">
                  {/* Header: logo + nama + deskripsi */}
                  <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
                    <div className="flex-shrink-0">
                      <img
                        src={logoSmk}
                        alt={schoolProfile.school_name}
                        className="w-24 h-24 object-contain rounded-2xl shadow-xl bg-white p-2"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-2">{schoolProfile.school_name}</h3>
                      {schoolProfile.tagline && (
                        <p className="text-lg font-semibold mb-3" style={{ color: '#F5C518' }}>{schoolProfile.tagline}</p>
                      )}
                      {schoolProfile.description && (
                        <p className="text-white/80 leading-relaxed">{schoolProfile.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Visi & Misi — Wall Frame Style */}
                  {(schoolProfile.vision || schoolProfile.mission) && (
                    <div className="mt-10">
                      <h4 className="text-xl font-bold text-white mb-8 text-center tracking-wide">Visi &amp; Misi</h4>

                      {/* Dinding */}
                      <div
                        className="rounded-2xl p-8 md:p-14"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                          {/* Bingkai Visi */}
                          {schoolProfile.vision && (
                            <div className="relative flex flex-col items-center pt-10">
                              {/* Paku */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                                <div
                                  className="w-5 h-5 rounded-full border border-gray-400"
                                  style={{ background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #888, #555)' }}
                                />
                                <div className="w-1 h-2 bg-gray-500 rounded-b-sm" />
                              </div>
                              {/* Tali */}
                              <div className="absolute top-5 left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
                                <svg width="100" height="22" viewBox="0 0 100 22" fill="none">
                                  <path d="M50 0 Q15 20 0 22" stroke="#7a6348" strokeWidth="1.8" strokeLinecap="round" />
                                  <path d="M50 0 Q85 20 100 22" stroke="#7a6348" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </div>

                              {/* Frame */}
                              <div
                                className="-rotate-1 hover:rotate-0 transition-transform duration-500"
                                style={{ filter: 'drop-shadow(5px 10px 18px rgba(0,0,0,0.5))' }}
                              >
                                {/* Kayu luar */}
                                <div style={{ background: 'linear-gradient(160deg, #7c5228 0%, #3e2410 40%, #5a3a18 70%, #3e2410 100%)', padding: '16px' }}>
                                  {/* List emas */}
                                  <div style={{ background: 'linear-gradient(135deg, #d4a843, #8b6010, #d4a843, #8b6010)', padding: '5px' }}>
                                    {/* Mat putih */}
                                    <div style={{ background: '#f8f7f4', padding: '18px' }}>
                                      {/* Isi */}
                                      <div
                                        style={{
                                          background: 'linear-gradient(135deg, #eef0ff, #dde0ff)',
                                          minHeight: '190px',
                                          padding: '22px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          maxWidth: '280px',
                                        }}
                                      >
                                        <div className="flex items-center gap-2 mb-4">
                                          <div className="h-px flex-1" style={{ width: '28px', background: '#2E2D8F', opacity: 0.4 }} />
                                          <div className="w-2 h-2 rotate-45" style={{ background: '#2E2D8F' }} />
                                          <span className="text-xs font-bold tracking-[0.35em] px-1" style={{ color: '#1E1D6F' }}>VISI</span>
                                          <div className="w-2 h-2 rotate-45" style={{ background: '#2E2D8F' }} />
                                          <div className="h-px flex-1" style={{ width: '28px', background: '#2E2D8F', opacity: 0.4 }} />
                                        </div>
                                        <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm text-center">
                                          {schoolProfile.vision}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bingkai Misi */}
                          {schoolProfile.mission && (
                            <div className="relative flex flex-col items-center pt-10">
                              {/* Paku */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                                <div
                                  className="w-5 h-5 rounded-full border border-gray-400"
                                  style={{ background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #888, #555)' }}
                                />
                                <div className="w-1 h-2 bg-gray-500 rounded-b-sm" />
                              </div>
                              {/* Tali */}
                              <div className="absolute top-5 left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
                                <svg width="100" height="22" viewBox="0 0 100 22" fill="none">
                                  <path d="M50 0 Q15 20 0 22" stroke="#7a6348" strokeWidth="1.8" strokeLinecap="round" />
                                  <path d="M50 0 Q85 20 100 22" stroke="#7a6348" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </div>

                              {/* Frame */}
                              <div
                                className="rotate-1 hover:rotate-0 transition-transform duration-500"
                                style={{ filter: 'drop-shadow(5px 10px 18px rgba(0,0,0,0.5))' }}
                              >
                                {/* Kayu luar */}
                                <div style={{ background: 'linear-gradient(160deg, #7c5228 0%, #3e2410 40%, #5a3a18 70%, #3e2410 100%)', padding: '16px' }}>
                                  {/* List emas */}
                                  <div style={{ background: 'linear-gradient(135deg, #d4a843, #8b6010, #d4a843, #8b6010)', padding: '5px' }}>
                                    {/* Mat putih */}
                                    <div style={{ background: '#f8f7f4', padding: '18px' }}>
                                      {/* Isi */}
                                      <div
                                        style={{
                                          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                                          minHeight: '190px',
                                          padding: '22px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          maxWidth: '280px',
                                        }}
                                      >
                                        <div className="flex items-center gap-2 mb-4">
                                          <div className="h-px flex-1" style={{ width: '28px', background: '#D4A800', opacity: 0.6 }} />
                                          <div className="w-2 h-2 rotate-45" style={{ background: '#D4A800' }} />
                                          <span className="text-xs font-bold tracking-[0.35em] px-1" style={{ color: '#92400e' }}>MISI</span>
                                          <div className="w-2 h-2 rotate-45" style={{ background: '#D4A800' }} />
                                          <div className="h-px flex-1" style={{ width: '28px', background: '#D4A800', opacity: 0.6 }} />
                                        </div>
                                        <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm text-center">
                                          {schoolProfile.mission}
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

                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-white font-semibold">Profil sekolah belum tersedia</p>
                <p className="text-white/60 text-sm mt-2">Silakan hubungi administrator untuk informasi lebih lanjut</p>
              </div>
            )}
        </div>

        {/* Gold bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
      </section>

      {/* 3. School Programs - FROM API */}
      <section id="program" className="py-20 bg-white relative overflow-hidden">
        {/* Background Decoration with brand colors */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: '#2E2D8F' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: '#F5C518' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Program Unggulan</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Berbagai program berkualitas untuk mengembangkan potensi siswa
            </p>
            <div className="h-1.5 w-24 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(to right, #2E2D8F, #F5C518)' }} />
          </div>

          {/* Loading */}
          {programsLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2E2D8F' }} />
              <p className="mt-4 text-gray-500">Memuat program unggulan...</p>
            </div>
          )}

          {/* Empty */}
          {!programsLoading && programs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-4">📚</div>
              <p>Informasi program unggulan belum tersedia</p>
            </div>
          )}

          {/* Grid */}
          {!programsLoading && programs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {programs.map(program => (
                <ProgramCard key={program.id} program={program} apiBaseUrl={API_BASE_URL} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. School Facilities - FROM API (Center-focus carousel) */}
      <FacilitiesCarousel
        facilities={facilities}
        loading={facilitiesLoading}
        apiBaseUrl={API_BASE_URL}
      />

      {/* 5. School Activities - FROM API */}
      <SchoolActivitiesSection
        activities={activities}
        activitiesLoading={activitiesLoading}
        apiBaseUrl={API_BASE_URL}
      />

      {/* 6. Extracurriculars - FROM API */}
      <ExtracurricularsCarousel
        extracurriculars={extracurriculars}
        loading={extracurricularsLoading}
        apiBaseUrl={API_BASE_URL}
      />

      {/* 7. School Achievements - FROM API */}
      <SchoolAchievementsSection
        achievements={achievements}
        achievementsLoading={achievementsLoading}
        apiBaseUrl={API_BASE_URL}
      />

      {/* 8. Articles - FROM API */}
      <ArticlesSection
        articles={articleList}
        articlesLoading={articlesLoading}
        apiBaseUrl={API_BASE_URL}
      />

      {/* CTA Section */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1D6F 0%, #2E2D8F 100%)' }}
      >
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#F5C518 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#F5C518' }}>
              Portal Akademik
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Kelola akademik lebih mudah dari mana saja
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Sistem informasi sekolah yang terintegrasi — dari data siswa, jadwal, nilai, hingga laporan, semua tersedia dalam satu platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 font-semibold rounded-lg transition-colors"
                style={{ background: '#F5C518', color: '#1E1D6F' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#D4A800')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F5C518')}
              >
                Masuk ke Portal
              </button>
              <a
                href="#profil"
                className="px-6 py-3 font-semibold rounded-lg transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                Tentang Sekolah
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f0e3d', color: 'white' }}>
        {/* Gold top border */}
        <div className="h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-start gap-3 mb-4">
                <img
                  src={schoolProfile?.logo ? `${API_BASE_URL}${schoolProfile.logo}` : logoSmk}
                  alt={schoolProfile?.school_name || "Logo Sekolah"}
                  className="w-12 h-12 object-contain rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-bold">{schoolProfile?.school_name || "SMK Muhammadiyah Sempor"}</h3>
                  <p className="text-sm" style={{ color: '#F5C518' }}>{schoolProfile?.tagline || "Excellent in Taqwa, Science, and Professional"}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4 text-center md:text-left" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {schoolProfile?.description || "Sekolah unggulan yang menghasilkan lulusan kompeten, kreatif, berakhlak mulia, dan siap menghadapi tantangan masa depan."}
              </p>
              <div className="flex gap-3 justify-center md:justify-start">
                {schoolProfile?.facebook && (
                  <a href={schoolProfile.facebook} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F5C518')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {schoolProfile?.instagram && (
                  <a href={schoolProfile.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F5C518')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {schoolProfile?.youtube && (
                  <a href={schoolProfile.youtube} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F5C518')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4 text-lg" style={{ color: '#F5C518' }}>Menu</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Beranda',         href: '#beranda'  },
                  { label: 'Profil Sekolah',  href: '#profil'   },
                  { label: 'Program',         href: '#program'  },
                  { label: 'Prestasi',        href: '#prestasi' },
                  { label: 'Kegiatan',       href: '#kegiatan' },
                  { label: 'Artikel',         href: '#artikel'  },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="transition" style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F5C518')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4 text-lg" style={{ color: '#F5C518' }}>Kontak</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {schoolProfile?.address && (
                  <li className="flex items-start gap-2 justify-center md:justify-start">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{schoolProfile.address}</span>
                  </li>
                )}
                {schoolProfile?.email && (
                  <li className="flex items-center gap-2 justify-center md:justify-start">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{schoolProfile.email}</span>
                  </li>
                )}
                {schoolProfile?.phone && (
                  <li className="flex items-center gap-2 justify-center md:justify-start">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{schoolProfile.phone}</span>
                  </li>
                )}
                {!schoolProfile?.address && !schoolProfile?.email && !schoolProfile?.phone && (
                  <>
                    <li className="flex items-start gap-2 justify-center md:justify-start">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Jalan Kelampok - Gombong, Sampang, Kec. Sempor, Kabupaten Kebumen, Jawa Tengah 54421</span>
                    </li>
                    <li className="flex items-center gap-2 justify-center md:justify-start">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>info@smkmuhsempor.sch.id</span>
                    </li>
                    <li className="flex items-center gap-2 justify-center md:justify-start">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>(0287) 123456</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(245,197,24,0.2)' }}>
            <p className="text-sm text-center md:text-left" style={{ color: 'rgba(255,255,255,0.5)' }}>
              © 2026 {schoolProfile?.school_name || "SMK Muhammadiyah Sempor"}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              {['Kebijakan Privasi', 'Syarat & Ketentuan'].map(item => (
                <a key={item} href="#" className="transition" style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F5C518')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)')}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

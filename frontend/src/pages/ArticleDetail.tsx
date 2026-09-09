import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { getArticleBySlug, getArticles } from '../services/article.service';
import type { Article } from '../types/article';
import logoSmk from '../assets/logo-smk.png';
import { getSchoolProfile } from '../services/schoolProfile.service';
import type { SchoolProfile } from '../types/schoolProfile';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const SIDEBAR_PER_PAGE = 6;

// ─── Mobile horizontal article card ──────────────────────────────────────────
function MobileArticleCard({
  item,
  active,
  apiBaseUrl,
  onClick,
}: {
  item: Article;
  active: boolean;
  apiBaseUrl: string;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-44 snap-start rounded-xl overflow-hidden text-left transition-all duration-200 border ${
        active
          ? 'border-blue-300 shadow-md'
          : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
      } bg-white`}
    >
      {/* Thumbnail */}
      <div className="w-full h-24 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {item.thumbnail && !imgErr ? (
          <img
            src={`${apiBaseUrl}${item.thumbnail}`}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className={`text-xs font-semibold line-clamp-2 leading-snug ${
          active ? 'text-blue-700' : 'text-gray-800'
        }`}>
          {item.title}
        </p>
        {item.published_at && (
          <p className="text-[10px] text-gray-400 mt-1">
            {new Date(item.published_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Sidebar article card ─────────────────────────────────────────────────────
function SidebarCard({
  item,
  active,
  onClick,
}: {
  item: Article;
  active: boolean;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`w-full flex gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
        active
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Thumbnail kecil */}
      <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100">
        {item.thumbnail && !imgErr ? (
          <img
            src={`${API_BASE_URL}${item.thumbnail}`}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Newspaper className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold line-clamp-2 leading-snug ${
          active ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
        }`}>
          {item.title}
        </p>
        {item.excerpt && (
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.excerpt}</p>
        )}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle]       = useState<Article | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [thumbError, setThumbError] = useState(false);

  // Sidebar
  const [allArticles, setAllArticles]   = useState<Article[]>([]);
  const [sidebarPage, setSidebarPage]   = useState(1);
  const [sidebarTotal, setSidebarTotal] = useState(0);
  const sidebarPages = Math.ceil(sidebarTotal / SIDEBAR_PER_PAGE);

  // Navbar
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [scrolled, setScrolled]           = useState(false);

  // ── Scroll navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── School profile
  useEffect(() => {
    getSchoolProfile().then(setSchoolProfile).catch(() => {});
  }, []);

  // ── Main article
  useEffect(() => {
    if (!slug) return;
    setThumbError(false);
    setLoading(true);
    setError(null);
    getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setError('Artikel tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Sidebar articles (paginated)
  useEffect(() => {
    getArticles({
      is_published: true,
      page: sidebarPage,
      limit: SIDEBAR_PER_PAGE,
    })
      .then(res => {
        setAllArticles(res.data);
        setSidebarTotal(res.metadata.total);
      })
      .catch(() => {});
  }, [sidebarPage]);

  // ── Scroll to top
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  // ── Helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const renderContent = (content: string) =>
    content
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((para, i) => (
        <p key={i} className="mb-5 text-gray-700 leading-relaxed text-base">
          {para}
        </p>
      ));

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg border-b border-gray-200' : 'bg-white shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img
                src={schoolProfile?.logo ? `${API_BASE_URL}${schoolProfile.logo}` : logoSmk}
                alt="Logo"
                className="w-9 h-9 object-contain rounded-lg"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-800 leading-tight">
                  {schoolProfile?.school_name || 'SMK Muhammadiyah Sempor'}
                </p>
                <p className="text-xs text-gray-500">
                  {schoolProfile?.tagline || 'Excellent in Taqwa, Science, and Professional'}
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>
        </div>
      </nav>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="pt-16 max-w-7xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-gray-500">Memuat artikel...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-6xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
              <p className="text-gray-500 mb-6">
                Artikel yang kamu cari tidak ada atau sudah dihapus.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && article && (
          <div className="flex gap-6">
            {/* ── Sidebar kiri ────────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 px-1 mt-8">
                Artikel Lainnya
              </h3>

              <div className="flex flex-col gap-1">
                {allArticles.map(item => (
                  <SidebarCard
                    key={item.id}
                    item={item}
                    active={item.slug === slug}
                    onClick={() => navigate(`/artikel/${item.slug}`)}
                  />
                ))}
              </div>

              {/* Pagination sidebar */}
              {sidebarPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <button
                    onClick={() => setSidebarPage(p => Math.max(1, p - 1))}
                    disabled={sidebarPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    {sidebarPage} / {sidebarPages}
                  </span>
                  <button
                    onClick={() => setSidebarPage(p => Math.min(sidebarPages, p + 1))}
                    disabled={sidebarPage === sidebarPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </aside>

            {/* ── Konten utama ─────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* Breadcrumb */}
              <nav className="flex flex-wrap items-center gap-1.5 text-sm mb-5">
                <button
                  onClick={() => navigate('/#artikel')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Artikel &amp; Berita
                </button>
                {article.category && (
                  <>
                    <span className="text-gray-300">›</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Tag className="w-3.5 h-3.5" />
                      {article.category}
                    </span>
                  </>
                )}
                <span className="text-gray-300">›</span>
                <span className="text-gray-400 line-clamp-1 max-w-xs">{article.title}</span>
              </nav>

              {/* Judul */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
                {article.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 pb-5 border-b border-gray-100">
                {article.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    {formatDate(article.published_at)}
                  </span>
                )}
                {article.author_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    {article.author_name}
                  </span>
                )}
                {article.category && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <Tag className="w-3 h-3" />
                    {article.category}
                  </span>
                )}
              </div>

              {/* Thumbnail */}
              {article.thumbnail && !thumbError && (
                <div className="mb-6 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={`${API_BASE_URL}${article.thumbnail}`}
                    alt={article.title}
                    className="w-full max-h-[420px] object-cover"
                    onError={() => setThumbError(true)}
                  />
                </div>
              )}

              {/* Excerpt / highlight */}
              {article.excerpt && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg px-5 py-3.5 mb-6">
                  <p className="text-blue-800 leading-relaxed italic text-sm">
                    {article.excerpt}
                  </p>
                </div>
              )}

              {/* Konten */}
              <div className="text-gray-700 leading-relaxed">
                {article.content ? (
                  renderContent(article.content)
                ) : (
                  <div className="flex flex-col items-center py-10 text-gray-300">
                    <Newspaper className="w-10 h-10 mb-3" />
                    <p className="text-sm">Konten artikel belum tersedia</p>
                  </div>
                )}
              </div>

              {/* Footer artikel */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                {article.published_at && (
                  <span className="text-xs text-gray-400">
                    Diterbitkan {formatDate(article.published_at)}
                  </span>
                )}
              </div>

              {/* ── Artikel Lainnya (mobile/tablet only) ─────────────── */}
              {allArticles.length > 0 && (
                <div className="lg:hidden mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Artikel Lainnya
                    </h3>
                    {sidebarPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSidebarPage(p => Math.max(1, p - 1))}
                          disabled={sidebarPage === 1}
                          className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-400">{sidebarPage} / {sidebarPages}</span>
                        <button
                          onClick={() => setSidebarPage(p => Math.min(sidebarPages, p + 1))}
                          disabled={sidebarPage === sidebarPages}
                          className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Horizontal scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                    {allArticles.map(item => (
                      <MobileArticleCard
                        key={item.id}
                        item={item}
                        active={item.slug === slug}
                        apiBaseUrl={API_BASE_URL}
                        onClick={() => navigate(`/artikel/${item.slug}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()}{' '}
            {schoolProfile?.school_name || 'SMK Muhammadiyah Sempor'}.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

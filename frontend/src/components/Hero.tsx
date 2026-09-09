import { useEffect, useState } from 'react';
import heroService from '../services/hero.service';
import type { HeroSlide } from '../types/hero';

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Auto-slide setiap 5 detik

    return () => clearInterval(interval);
  }, [slides.length]);

  const fetchHeroSlides = async () => {
    try {
      setIsLoading(true);
      const response = await heroService.getAll(true); // Hanya ambil yang active
      if (response.data && Array.isArray(response.data)) {
        setSlides(response.data);
      } else {
        setSlides([]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch hero slides:', err);
      // Set dummy data sebagai fallback
      setSlides([
        {
          id: '1',
          title: 'Selamat Datang di SIAKAD MUSA',
          subtitle: 'Sistem Informasi Akademik Modern',
          description: 'Platform akademik terintegrasi untuk pengelolaan data siswa, guru, dan akademik',
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
      setError(null); // Jangan tampilkan error karena sudah ada fallback
    } finally {
      setIsLoading(false);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] md:h-screen bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-[600px] md:h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={fetchHeroSlides}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[600px] md:h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-xl">Tidak ada hero slide tersedia</p>
      </div>
    );
  }

  return (
    <div id="beranda" className="relative w-full h-[600px] md:h-screen overflow-hidden bg-gray-900">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${
                  slide.image.startsWith('http') 
                    ? slide.image 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${slide.image}`
                })` 
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-center px-4 md:px-8">
              <div className="text-center text-white max-w-4xl mx-auto">
                <h1 
                  className={`text-4xl md:text-6xl font-bold mb-4 ${
                    index === currentIndex ? 'animate-slide-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: '0.1s' }}
                >
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <h2 
                    className={`text-2xl md:text-3xl font-medium mb-6 ${
                      index === currentIndex ? 'animate-slide-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: '0.3s' }}
                  >
                    {slide.subtitle}
                  </h2>
                )}
                {slide.description && (
                  <p 
                    className={`text-lg md:text-xl text-gray-200 ${
                      index === currentIndex ? 'animate-slide-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: '0.5s' }}
                  >
                    {slide.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

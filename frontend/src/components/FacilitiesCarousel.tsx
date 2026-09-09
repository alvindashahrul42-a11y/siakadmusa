import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SchoolFacility } from '../types/facility';

interface Props {
  facilities: SchoolFacility[];
  loading: boolean;
  apiBaseUrl: string;
}

export default function FacilitiesCarousel({ facilities, loading, apiBaseUrl }: Props) {
  const [active, setActive] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = facilities.length;

  const prev = useCallback(() => {
    setActive(i => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setActive(i => (i + 1) % total);
  }, [total]);

  // Auto-play every 4s
  useEffect(() => {
    if (total < 2) return;
    autoplayRef.current = setInterval(next, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [next, total]);

  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };
  const resumeAutoplay = () => {
    if (total < 2) return;
    autoplayRef.current = setInterval(next, 4000);
  };

  // Returns the slot index: -2, -1, 0 (center), 1, 2
  const getSlot = (idx: number) => {
    let diff = idx - active;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const slotStyle = (slot: number): React.CSSProperties => {
    // Only render slots -2 to 2
    const visible = Math.abs(slot) <= 2;
    const zIndex = 10 - Math.abs(slot) * 2;

    const configs: Record<number, React.CSSProperties> = {
      0: {
        transform: 'translateX(-50%) scale(1)',
        left: '50%',
        opacity: 1,
        zIndex: 20,
        filter: 'none',
      },
      1: {
        transform: 'translateX(0%) scale(0.82)',
        left: 'calc(50% + 260px)',
        opacity: 0.7,
        zIndex: zIndex,
        filter: 'brightness(0.75)',
      },
      '-1': {
        transform: 'translateX(-100%) scale(0.82)',
        left: 'calc(50% - 260px)',
        opacity: 0.7,
        zIndex: zIndex,
        filter: 'brightness(0.75)',
      },
      2: {
        transform: 'translateX(0%) scale(0.65)',
        left: 'calc(50% + 430px)',
        opacity: 0.45,
        zIndex: zIndex,
        filter: 'brightness(0.55)',
      },
      '-2': {
        transform: 'translateX(-100%) scale(0.65)',
        left: 'calc(50% - 430px)',
        opacity: 0.45,
        zIndex: zIndex,
        filter: 'brightness(0.55)',
      },
    };

    return {
      position: 'absolute',
      top: 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      display: visible ? 'block' : 'none',
      ...(configs[slot] ?? { display: 'none' }),
    };
  };

  return (
    <section
      id="fasilitas"
      className="py-20 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0f0e3d 0%, #1E1D6F 50%, #2E2D8F 100%)' }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#F5C518 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      {/* Gold top border */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Fasilitas Sekolah</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(245,197,24,0.85)' }}>
            Fasilitas modern dan lengkap untuk menunjang kegiatan belajar mengajar
          </p>
          <div className="h-1.5 w-24 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800)' }} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#F5C518' }} />
            <p className="mt-4" style={{ color: 'rgba(245,197,24,0.8)' }}>Memuat fasilitas...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏫</div>
            <p style={{ color: 'rgba(245,197,24,0.7)' }}>Informasi fasilitas belum tersedia</p>
          </div>
        )}

        {/* Carousel */}
        {!loading && total > 0 && (
          <div
            className="relative mx-auto"
            style={{ height: '420px', maxWidth: '1100px' }}
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
          >
            {facilities.map((facility, idx) => {
              const slot = getSlot(idx);
              if (Math.abs(slot) > 2) return null;

              return (
                <div
                  key={facility.id}
                  style={slotStyle(slot)}
                  onClick={() => slot !== 0 && setActive(idx)}
                  className={slot !== 0 ? 'cursor-pointer' : ''}
                >
                  <div
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                    style={{ width: '340px' }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden" style={{ height: '240px' }}>
                      {!imageErrors[facility.id] && facility.image ? (
                        <img
                          src={`${apiBaseUrl}${facility.image}`}
                          alt={facility.name}
                          className="w-full h-full object-cover"
                          onError={() =>
                            setImageErrors(prev => ({ ...prev, [facility.id]: true }))
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eef0ff, #dde0ff)' }}>
                          <svg
                            className="w-20 h-20 opacity-30"
                            style={{ color: '#2E2D8F' }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      {/* gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {facility.name}
                      </h4>
                      {facility.description ? (
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {facility.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Tidak ada deskripsi</p>
                      )}
                      <span className="inline-flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Tersedia
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Prev / Next buttons */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 border"
                  style={{ background: 'rgba(245,197,24,0.2)', borderColor: 'rgba(245,197,24,0.5)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.5)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.2)')}
                  aria-label="Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 border"
                  style={{ background: 'rgba(245,197,24,0.2)', borderColor: 'rgba(245,197,24,0.5)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.5)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.2)')}
                  aria-label="Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Dots */}
        {!loading && total > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {facilities.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className="rounded-full transition-all duration-300"
                style={
                  idx === active
                    ? { width: '1.75rem', height: '0.625rem', background: '#F5C518' }
                    : { width: '0.625rem', height: '0.625rem', background: 'rgba(245,197,24,0.35)' }
                }
                onMouseEnter={e => { if (idx !== active) (e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.65)'; }}
                onMouseLeave={e => { if (idx !== active) (e.currentTarget as HTMLElement).style.background = 'rgba(245,197,24,0.35)'; }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Gold bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #F5C518, #D4A800, #F5C518)' }} />
    </section>
  );
}

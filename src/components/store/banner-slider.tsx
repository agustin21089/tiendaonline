"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  image: string;
  title?: string | null;
  subtitle?: string | null;
  link?: string | null;
};

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, banners.length, paused]);

  if (banners.length === 0) {
    return (
      <section className="relative h-[65vh] min-h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-arena-100 via-arena-200 to-warm-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl font-light text-warm-800 leading-tight mb-3">
            Decorá tu hogar con amor
          </h1>
          <p className="text-warm-600 text-lg mb-5">
            Los mejores muebles y accesorios para cada rincón de tu casa
          </p>
          <Link
            href="/categoria/living"
            className="inline-block px-7 py-3 bg-arena-600 text-white rounded-full text-sm font-medium hover:bg-arena-700 transition-colors shadow-sm"
          >
            Ver colección →
          </Link>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative h-[65vh] min-h-80 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={b.image}
            alt={b.title ?? "Banner"}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
        <h1 className="font-display text-4xl md:text-6xl font-light text-white leading-tight mb-3 drop-shadow">
          {banner.title ?? "Decorá tu hogar con amor"}
        </h1>
        {banner.subtitle && (
          <p className="text-white/85 text-lg mb-5 drop-shadow">{banner.subtitle}</p>
        )}
        <Link
          href={banner.link ?? "/categoria/living"}
          className="inline-block px-7 py-3 bg-white text-arena-800 rounded-full text-sm font-medium hover:bg-arena-50 transition-colors shadow-md"
        >
          Ver colección →
        </Link>
      </div>

      {/* Prev / Next */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/25 hover:bg-black/45 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/25 hover:bg-black/45 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators with animated progress on active dot */}
          <div className="absolute bottom-6 right-8 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); }}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 overflow-hidden relative ${
                  i === current ? "bg-white/40 w-6" : "bg-white/50 w-2"
                }`}
              >
                {i === current && !paused && (
                  <span
                    key={current}
                    className="absolute inset-y-0 left-0 bg-white rounded-full"
                    style={{
                      animation: "slideProgress 5s linear forwards",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <style>{`
            @keyframes slideProgress {
              from { width: 0% }
              to   { width: 100% }
            }
          `}</style>
        </>
      )}
    </section>
  );
}

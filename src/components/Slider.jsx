import { useEffect, useState, useCallback } from 'react';

function Slider({
  items = [],
  renderItem,
  autoPlayInterval = 5000,
  pauseOnHover = true,
  showIndicators = true,
  showArrows = true,
  className = '',
  trackClassName = '',
  ariaLabel = 'Slider'
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const hasMultiple = items.length > 1;

  const goTo = useCallback((idx) => {
    if (items.length === 0) return;
    const next = ((idx % items.length) + items.length) % items.length;
    setCurrentIndex(next);
  }, [items.length]);

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (!hasMultiple || paused) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [items.length, hasMultiple, paused, autoPlayInterval]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div
        className={`flex transition-transform duration-500 ease-in-out ${trackClassName}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div key={index} className="w-full flex-shrink-0 px-4">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {showArrows && hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label="Slide precedente"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
            aria-label="Slide successiva"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {showIndicators && hasMultiple && (
        <div className="flex justify-center mt-6 space-x-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`}
              aria-label={`Vai alla slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Slider;
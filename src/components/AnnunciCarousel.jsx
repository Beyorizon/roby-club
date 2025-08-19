import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

// Componente Card integrato per gli annunci

function AnnouncementCard({ title, subtitle, body, imageSrc, imageAlt, footer, itemId }) {
  const navigate = useNavigate();

  // Controlla se il testo è troppo lungo (circa 100 caratteri per 2 righe)
  const shouldShowReadMore = body && body.length > 100;

  const handleReadMore = () => {
    if (itemId) {
      navigate(`/notizie?highlight=${itemId}`);
    } else {
      navigate('/notizie');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 h-[200px] w-full flex flex-col">
      {imageSrc && (
        <div className="aspect-video bg-gray-800 relative overflow-hidden flex-shrink-0">
          <img
            src={imageSrc}
            alt={imageAlt || title || 'immagine'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        {title && (
          <h3 className="font-semibold text-white mb-2 text-lg text-center line-clamp-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-indigo-300 text-sm mb-3 text-center flex-shrink-0">
            {subtitle}
          </p>
        )}
        {body && (
          <div className="flex-1 flex flex-col justify-between">
            <p className="text-white/80 leading-relaxed text-center break-words text-sm flex-1 overflow-hidden line-clamp-2">
              {body}
            </p>
            {shouldShowReadMore && (
              <button
                onClick={handleReadMore}
                className="mt-3 mx-auto px-4 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium rounded-full transition-all duration-200 border border-indigo-400/30 hover:border-indigo-300/50"
              >
                Leggi tutto
              </button>
            )}
          </div>
        )}
        {footer && <div className="mt-2 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// Componente Carousel principale
export default function AnnunciCarousel({ items = [] }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Reset refs array quando cambia il numero di elementi
  const length = items?.length || 0;
  useEffect(() => {
    itemRefs.current = new Array(length);
    setCurrentIndex(0);
  }, [length]);

  // Funzione per scrollare solo in orizzontale
  const scrollToIndex = (index) => {
    const container = containerRef.current;
    const item = itemRefs.current[index];
    if (!container || !item) return;
  
    container.scrollTo({
      left: item.offsetLeft - container.offsetLeft,
      behavior: "smooth",
    });
  };

  // Autoplay con 5 secondi di pausa
  useEffect(() => {
    if (length <= 1) return;

    const startAutoplay = () => {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % length;
          const prevIndex = (prev - 1 + length) % length;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }, 5000);
    };

    startAutoplay();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [length]);

  // Riesegue il centramento su resize
  useEffect(() => {
    const onResize = () => scrollToIndex(currentIndex, "auto");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  const handleManualScroll = useMemo(() => {
    // Sincronizza l'indice in base allo scroll
    return () => {
      if (!containerRef.current || !itemRefs.current.length) return;
      const { scrollLeft, clientWidth } = containerRef.current;
      const center = scrollLeft + clientWidth / 2;

      let nearestIndex = 0;
      let nearestDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const contRect = containerRef.current.getBoundingClientRect();
        const elCenter = rect.left - contRect.left + rect.width / 2 + containerRef.current.scrollLeft;
        const dist = Math.abs(elCenter - center);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = idx;
        }
      });

      setCurrentIndex(nearestIndex);
    };
  }, []);

  // Pausa autoplay al hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 3000);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={containerRef}
        onScroll={handleManualScroll}
        className="
          flex gap-6 overflow-x-auto scroll-smooth -mx-6 px-20
          snap-x snap-mandatory
          scrollbar-hide
        "
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        aria-label="Annunci carousel"
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            ref={(el) => (itemRefs.current[index] = el)}
            className="flex-none snap-center"
          >
            <div className="
              w-[280px] h-[200px]
              md:w-[320px] md:h-[200px]
              lg:w-[360px] lg:h-[200px]
            ">
              <AnnouncementCard
                title={item.titolo}
                subtitle={new Date(item.created_at).toLocaleDateString('it-IT')}
                body={item.contenuto}
                imageSrc={item.immagine_url}
                imageAlt={item.titolo}
                itemId={item.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
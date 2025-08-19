import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useNavigate } from 'react-router-dom';

import "swiper/css";

// Componente Card integrato
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
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full">
      <Swiper
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        slidesPerView="auto"
        centeredSlides={true}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        modules={[Autoplay]}
        className="mySwiper !overflow-visible"
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={item.id || index}
            className="max-w-[280px] md:max-w-[320px] lg:max-w-[360px]"
          >
            <div className="px-3">
              <AnnouncementCard
                title={item.titolo}
                subtitle={new Date(item.created_at).toLocaleDateString('it-IT')}
                body={item.contenuto}
                imageSrc={item.immagine_url}
                imageAlt={item.titolo}
                itemId={item.id}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";


export default function Carousel({ items, renderItem }) {
  const [activeIndex, setActiveIndex] = useState(
    Math.floor(items.length / 2) // parte dal centro
  );

  return (
    <div className="w-full">
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        initialSlide={activeIndex}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        modules={[EffectCoverflow]}
        className="mySwiper mx-6 px-6"
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={index}
            className="!w-auto"
          >
            {renderItem(item)}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Paginazione custom sotto lo slider */}
      <div className="flex justify-center mt-6 space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === activeIndex ? "bg-white scale-125" : "bg-white/40"
            }`}
            onClick={() => {
              document.querySelector(".mySwiper").swiper.slideTo(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}


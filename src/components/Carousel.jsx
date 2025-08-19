import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";


export default function Carousel({ items, renderItem }) {
  return (
    <>
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        initialSlide={Math.floor(items.length / 2)} // 👈 parte dal centro
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true, el: ".swiper-pagination" }}
        modules={[EffectCoverflow, Pagination]}
        className="mySwiper"
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={index}
            className="max-w-[280px] md:max-w-[320px]"
          >
            {renderItem(item)}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pallini sotto lo slider */}
      <div className="swiper-pagination mt-4"></div>
    </>
  );
}

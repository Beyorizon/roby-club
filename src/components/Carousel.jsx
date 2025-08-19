import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { useState } from "react";

export default function Carousel({ items, renderItem }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        loop={true} // 👈 loop infinito
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}

        modules={[EffectCoverflow]}
        className="mySwiper !overflow-visible"
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)} // 👈 usa realIndex invece di activeIndex
        initialSlide={0} // 👈 parti sempre dalla prima slide
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
    </>
  );
}

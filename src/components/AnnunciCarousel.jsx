import { useEffect, useMemo, useRef, useState } from "react";

export default function AnnunciCarousel({ items = [], renderItem }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset refs array size quando cambia il numero di elementi
  const length = items?.length || 0;
  useEffect(() => {
    itemRefs.current = new Array(length);
    setCurrentIndex(0);
  }, [length]);

  const scrollToIndex = (index, behavior = "smooth") => {
    if (!itemRefs.current[index]) return;
    itemRefs.current[index].scrollIntoView({
      behavior,
      block: "nearest",
      inline: "center",
    });
  };

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

  return (
    <div className="relative">
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
            key={index}
            ref={(el) => (itemRefs.current[index] = el)}
            className="
              flex-none snap-center
            "
          >
            <div
              className="
                w-[280px] h-[150px]
                md:w-[320px] md:h-[150px]
                lg:w-[360px] lg:h-[150px]
              "
            >
              {renderItem(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
    
  );
}
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CardCarouselProps {
  cards: React.ReactNode[];
  cardWidth: number;
  gap: number;
  visibleCards?: number;
}

const CardCarousel: React.FC<CardCarouselProps> = ({
  cards,
  cardWidth,
  gap,
  visibleCards = 4,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate container width based on visible cards
  const containerWidth = cardWidth * visibleCards + gap * (visibleCards - 1);

  useEffect(() => {
    const updateMaxScroll = () => {
      if (carouselRef.current) {
        const max =
          carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        setMaxScroll(max);
      }
    };

    updateMaxScroll();
    window.addEventListener("resize", updateMaxScroll);
    return () => window.removeEventListener("resize", updateMaxScroll);
  }, [cards, cardWidth, gap, visibleCards]);

  const handleScroll = () => {
    if (carouselRef.current) {
      setScrollPosition(carouselRef.current.scrollLeft);
    }
  };

  const scrollPrev = () => {
    if (!carouselRef.current || isAnimating) return;

    setIsAnimating(true);
    const scrollAmount = cardWidth * visibleCards + gap * visibleCards;
    const newPosition = Math.max(scrollPosition - scrollAmount, 0);

    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    setTimeout(() => setIsAnimating(false), 500);
  };

  const scrollNext = () => {
    if (!carouselRef.current || isAnimating) return;

    setIsAnimating(true);
    const scrollAmount = cardWidth * visibleCards + gap * visibleCards;
    const newPosition = Math.min(scrollPosition + scrollAmount, maxScroll);

    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="relative mx-auto px-8">
      {" "}
      {/* Centered container with max width */}
      {/* Navigation Buttons */}
      <motion.button
        onClick={scrollPrev}
        className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl hover:shadow-2xl transition-all ${
          scrollPosition <= 0 ? "opacity-0 cursor-auto" : "opacity-100"
        }`}
        disabled={scrollPosition <= 0}
        aria-label="Previous"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ left: `-1.5rem` }} // Position outside container
      >
        <ChevronLeft className="h-7 w-7 text-white stroke-[2]" />
      </motion.button>
      <motion.button
        onClick={scrollNext}
        className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl hover:shadow-2xl transition-all ${
          scrollPosition >= maxScroll - 1
            ? "opacity-0 cursor-auto"
            : "opacity-100"
        }`}
        disabled={scrollPosition >= maxScroll}
        aria-label="Next"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ right: `-1.5rem` }} // Position outside container
      >
        <ChevronRight className="h-7 w-7 text-white stroke-[2]" />
      </motion.button>
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto  overflow-y-hidden scrollbar-hide snap-x snap-mandatory"
        style={{
          width: `${containerWidth}px`,
          margin: "0 auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          paddingLeft: `${gap / 2}px`,
          paddingRight: `${gap / 2}px`,
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            className="flex-shrink-0 snap-start"
            style={{
              width: `${cardWidth}px`,
              marginRight: `${index < cards.length - 1 ? gap : 0}px`,
              scrollSnapAlign: "start",
            }}
          >
            {card}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardCarousel;

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/SignatureCreations.css';

const cakeData = [
  {
    img: '/range/cupcakes.png',
    alt: 'Cupcakes',
    title: 'Cupcakes',
    link: '/collections/cupcakes',
  },
  {
    img: '/range/largecakes.png',
    alt: 'Large Cakes',
    title: 'Large Cakes',
    link: '/collections/large-cakes',
  },
  {
    img: '/range/bentocake.png',
    alt: 'Bento with Cupcakes',
    title: 'Bento with Cupcakes',
    link: '/collections/bento-cake-with-cupcakes',
  },
  {
    img: '/range/brownies.png',
    alt: 'Brownies',
    title: 'Brownies',
    link: '/collections/brownies',
  },
  {
    img: '/range/cookies.png',
    alt: 'Cookies',
    title: 'Cookies',
    link: '/collections/cookies',
  },
];

const AUTO_SCROLL_INTERVAL = 3500;

const SignatureCreations = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('next');
  const timeoutRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextSlide = () => {
    setDirection('next');
    setCurrent((prev) => (prev + 1) % cakeData.length);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrent((prev) => (prev - 1 + cakeData.length) % cakeData.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(nextSlide, AUTO_SCROLL_INTERVAL);
    return () => clearTimeout(timeoutRef.current);
  }, [current]);

  return (
    <section className="homepage-featured-cakes">
      <h2>Our Range</h2>
      <div className="signature-carousel">
        <button className="carousel-arrow left" onClick={prevSlide} aria-label="Previous">
          <FaChevronLeft size={38} color="#fff" />
        </button>
        {cakeData.map((cake, idx) => (
          <a
            href={cake.link}
            className={`carousel-slide${idx === current ? ' active' : ''}${idx === (current - 1 + cakeData.length) % cakeData.length ? ' prev' : ''}`}
            key={cake.title}
            style={{ display: 'block' }}
            tabIndex={idx === current ? 0 : -1}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img src={cake.img} alt={cake.alt} />
            <h3>{cake.title}</h3>
          </a>
        ))}
        <button className="carousel-arrow right" onClick={nextSlide} aria-label="Next">
          <FaChevronRight size={38} color="#fff" />
        </button>
      </div>
      <div className="carousel-dots">
        {cakeData.map((_, idx) => (
          <span
            key={idx}
            className={`carousel-dot${idx === current ? ' active' : ''}`}
            onClick={() => {
              setDirection(idx > current ? 'next' : 'prev');
              setCurrent(idx);
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default SignatureCreations; 
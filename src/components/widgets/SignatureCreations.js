import React, { useState, useEffect, useRef } from 'react';
import '../styles/SignatureCreations.css';

const cakeData = [
  {
    img: '/range/Cupcakes.png',
    alt: 'Cupcakes',
    title: 'Cupcakes',
    link: '/collections/cupcakes',
  },
  {
    img: '/range/LargeCakes.png',
    alt: 'Large Cakes',
    title: 'Large Cakes',
    link: '/collections/large-cakes',
  },
  {
    img: '/range/BentoCake.png',
    alt: 'Bento with Cupcakes',
    title: 'Bento with Cupcakes',
    link: '/collections/bento-cake-with-cupcakes',
  },
  {
    img: '/range/Brownies.png',
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
  const timeoutRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % cakeData.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + cakeData.length) % cakeData.length);

  useEffect(() => {
    timeoutRef.current = setTimeout(nextSlide, AUTO_SCROLL_INTERVAL);
    return () => clearTimeout(timeoutRef.current);
  }, [current]);

  return (
    <section className="homepage-featured-cakes">
      <h2>Our Range</h2>
      <div className="signature-carousel">
        <button className="carousel-arrow left" onClick={prevSlide} aria-label="Previous">&#8249;</button>
        {cakeData.map((cake, idx) => (
          <a
            href={cake.link}
            className={`carousel-slide${idx === current ? ' active' : ''}`}
            key={cake.title}
            style={{ display: idx === current ? 'block' : 'none' }}
            tabIndex={idx === current ? 0 : -1}
          >
            <img src={cake.img} alt={cake.alt} />
            <h3>{cake.title}</h3>
          </a>
        ))}
        <button className="carousel-arrow right" onClick={nextSlide} aria-label="Next">&#8250;</button>
      </div>
      <div className="carousel-dots">
        {cakeData.map((_, idx) => (
          <span
            key={idx}
            className={`carousel-dot${idx === current ? ' active' : ''}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </section>
  );
};

export default SignatureCreations; 
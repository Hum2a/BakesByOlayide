import React, { useState, useEffect } from 'react';

const OptimizedImage = ({ src, alt, className, style, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    // Create a tiny version of the image for blur-up loading
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      if (onError) onError();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onError]);

  return (
    <div 
      className={`optimized-image-container ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          className={`optimized-image ${isLoaded ? 'loaded' : ''}`}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={onError}
        />
      )}
    </div>
  );
};

export default OptimizedImage; 
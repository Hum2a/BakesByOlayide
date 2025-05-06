import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { FaStar, FaStarHalf } from 'react-icons/fa';
import '../styles/CakeModal.css';

const CakeModal = ({ cake, onClose, onAddToCart }) => {
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState(0);
  const [notes, setNotes] = useState('');

  const sizeOptions = Array.isArray(cake.sizes) ? cake.sizes : [];
  const shapeOptions = Array.isArray(cake.shapes) ? cake.shapes : [];

  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };
  const selectedShape = shapeOptions[selectedShapeIdx] || { price: 0, name: '' };
  const totalPrice = (selectedSize.price || 0) + (selectedShape.price || 0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'cakes', cake.id, 'reviews');
        const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(reviewsQuery);
        
        const reviewsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setReviews(reviewsData);
        
        // Calculate average rating
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(totalRating / reviewsData.length);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cake.id) {
      fetchReviews();
    }
  }, [cake.id]);

  const handleAddToCart = () => {
    addToCart({
      ...cake,
      selectedSize,
      selectedShape,
      price: totalPrice,
      notes: notes.trim()
    });
    if (onAddToCart) {
      onAddToCart();
    }
    onClose();
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star filled" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half-star" className="star filled" />);
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaStar key={`empty-star-${i}`} className="star" />);
    }

    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate minimum price from sizes
  const minPrice = Array.isArray(cake.sizes) && cake.sizes.length > 0
    ? Math.min(...cake.sizes.map(s => s.price))
    : 0;

  return (
    <div className="cakemodal-overlay" onClick={onClose}>
      <div className="cakemodal-content" onClick={e => e.stopPropagation()}>
        <button className="cakemodal-close" onClick={onClose}>×</button>
        
        <div className="cakemodal-grid">
          <div className="cakemodal-image">
            <img src={cake.image} alt={cake.name} />
          </div>
          
          <div className="cakemodal-details">
            <h2>{cake.name}</h2>
            <div className="cakemodal-rating">
              <div className="stars-container">
                {renderStars(averageRating)}
              </div>
              <span className="rating-text">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            <p className="cakemodal-price">£{totalPrice.toFixed(2)}</p>
            <div className="cakemodal-selectors">
              {sizeOptions.length > 0 && (
                <div className="cakemodal-selector-group">
                  <span className="cakemodal-selector-label">Size:</span>
                  <div className="cakemodal-selector-options">
                    {sizeOptions.map((size, idx) => (
                      <button
                        key={idx}
                        className={`cakemodal-selector-btn${selectedSizeIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedSizeIdx(idx)}
                      >
                        {size.size}" (£{size.price.toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {shapeOptions.length > 0 && (
                <div className="cakemodal-selector-group">
                  <span className="cakemodal-selector-label">Shape:</span>
                  <div className="cakemodal-selector-options">
                    {shapeOptions.map((shape, idx) => (
                      <button
                        key={idx}
                        className={`cakemodal-selector-btn${selectedShapeIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedShapeIdx(idx)}
                      >
                        {shape.name} {shape.price ? `(+£${shape.price.toFixed(2)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="cakemodal-notes-section">
              <label htmlFor="cakemodal-notes">Additional Notes (optional):</label>
              <textarea
                id="cakemodal-notes"
                className="cakemodal-notes-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g. No nuts, write 'Happy Birthday', etc."
                rows={2}
              />
            </div>
            <p className="cakemodal-description">{cake.description}</p>
            
            <div className="cakemodal-features">
              <h3>Features</h3>
              <ul>
                {cake.sizes && cake.sizes.length > 0 && (
                  <li>
                    Sizes: {cake.sizes.map(size => `${size.size}\" (£${size.price.toFixed(2)})`).join(', ')}
                  </li>
                )}
                {cake.shapes && cake.shapes.length > 0 && (
                  <li>
                    Shapes: {cake.shapes.map(shape => `${shape.name} ${shape.price ? `(+£${shape.price.toFixed(2)})` : ''}`).join(', ')}
                  </li>
                )}
                {cake.categories && cake.categories.length > 0 && (
                  <li>
                    Categories: {cake.categories.join(', ')}
                  </li>
                )}
                {cake.ingredients && cake.ingredients.length > 0 && (
                  <li>Ingredients: {cake.ingredients.join(', ')}</li>
                )}
                {cake.dietaryInfo && typeof cake.dietaryInfo === 'object' && Object.values(cake.dietaryInfo).some(Boolean) && (
                  <li>
                    Dietary Information: {Object.entries(cake.dietaryInfo).filter(([k, v]) => v).map(([k]) => k.replace(/^is/, '').replace(/([A-Z])/g, ' $1').trim()).join(', ')}
                  </li>
                )}
                {cake.allergens && cake.allergens.length > 0 && (
                  <li>Allergens: {cake.allergens.join(', ')}</li>
                )}
              </ul>
            </div>
            
            <div className="cakemodal-actions">
              <button 
                className="cakemodal-add-to-cart-btn"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        <div className="cakemodal-reviews">
          <h3>Customer Reviews</h3>
          {loading ? (
            <div className="reviews-loading">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">No reviews yet</div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">{review.userName}</span>
                      <span className="review-date">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  {review.review && (
                    <p className="review-text">{review.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CakeModal; 
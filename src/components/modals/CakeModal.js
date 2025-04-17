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
    addToCart(cake);
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
            <p className="cakemodal-price">£{cake.price.toFixed(2)}</p>
            <p className="cakemodal-description">{cake.description}</p>
            
            <div className="cakemodal-features">
              <h3>Features</h3>
              <ul>
                {cake.ingredients && cake.ingredients.length > 0 && (
                  <li>Ingredients: {cake.ingredients.join(', ')}</li>
                )}
                {cake.dietaryInfo && cake.dietaryInfo.length > 0 && (
                  <li>Dietary Information: {cake.dietaryInfo.join(', ')}</li>
                )}
                {cake.allergens && cake.allergens.length > 0 && (
                  <li>Allergens: {cake.allergens.join(', ')}</li>
                )}
                {cake.servingSize && (
                  <li>Serves: {cake.servingSize} people</li>
                )}
                {cake.dimensions && (
                  <li>Size: {cake.dimensions.size}{cake.dimensions.unit} {cake.dimensions.shape}</li>
                )}
                {cake.prepTime && (
                  <li>Preparation Time: {cake.prepTime.value} {cake.prepTime.unit}</li>
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
              <button 
                className="cakemodal-customize-btn"
                onClick={() => window.location.href = '/cake-builder'}
              >
                Customize
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
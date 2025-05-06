import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { FaStar, FaStarHalf, FaChevronRight } from 'react-icons/fa';
import '../styles/CakeModal.css';

const CakeModal = ({ cake, onClose, onAddToCart, allCakes = [], categories = [] }) => {
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState(0);
  const [selectedFinishIdx, setSelectedFinishIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [occasion, setOccasion] = useState('');
  const [addon, setAddon] = useState('');

  const sizeOptions = Array.isArray(cake.sizes) ? cake.sizes : [];
  const shapeOptions = Array.isArray(cake.shapes) ? cake.shapes : [];
  const finishOptions = Array.isArray(cake.finishes) ? cake.finishes : [];

  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };
  const selectedShape = shapeOptions[selectedShapeIdx] || { price: 0, name: '' };
  const selectedFinish = finishOptions[selectedFinishIdx] || { price: 0, name: '' };
  const totalPrice = (selectedSize.price || 0) + (selectedShape.price || 0) + (selectedFinish.price || 0);

  // Breadcrumbs
  const mainCategory = (cake.categories && cake.categories[0]) || 'Cakes';
  const breadcrumbs = [
    'Collections',
    mainCategory,
    cake.name
  ];
  // Related products (other cakes in the same category)
  const relatedProducts = (allCakes || [])
    .filter(c => c.id !== cake.id && c.categories && c.categories.includes(mainCategory))
    .slice(0, 3);

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
      selectedFinish,
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
        <nav className="cakemodal-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb}>
              {idx > 0 && <FaChevronRight className="cakemodal-breadcrumb-sep" />}
              <span className="cakemodal-breadcrumb">{crumb}</span>
            </span>
          ))}
        </nav>
        <div className="cakemodal-grid">
          <div className="cakemodal-image">
            <img src={cake.image} alt={cake.name} />
          </div>
          <div className="cakemodal-details">
            <h2>{cake.name}</h2>
            {cake.subtitle && <div className="cakemodal-subtitle">{cake.subtitle}</div>}
            <div className="cakemodal-available-sizes">
              {sizeOptions.length > 0 && (
                <span>Available in {sizeOptions.map(s => `${s.size}"`).join(', ')}</span>
              )}
            </div>
            <div className="cakemodal-price-row">
              <span className="cakemodal-price">From £{minPrice.toFixed(2)}</span>
            </div>
            <div className="cakemodal-description">{cake.description}</div>
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
                        {size.size}"
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
                        {shape.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {finishOptions.length > 0 && (
                <div className="cakemodal-selector-group">
                  <span className="cakemodal-selector-label">Finish:</span>
                  <div className="cakemodal-selector-options">
                    {finishOptions.map((finish, idx) => (
                      <button
                        key={idx}
                        className={`cakemodal-selector-btn${selectedFinishIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedFinishIdx(idx)}
                      >
                        {finish.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="cakemodal-selector-group">
                <span className="cakemodal-selector-label">Occasion:</span>
                <select
                  className="cakemodal-dropdown"
                  value={occasion}
                  onChange={e => setOccasion(e.target.value)}
                >
                  <option value="">Choose</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="cakemodal-selector-group">
                <span className="cakemodal-selector-label">Add ons:</span>
                <select
                  className="cakemodal-dropdown"
                  value={addon}
                  onChange={e => setAddon(e.target.value)}
                >
                  <option value="">Choose</option>
                  <option value="Candles">Candles</option>
                  <option value="Cake Topper">Cake Topper</option>
                  <option value="Gift Wrap">Gift Wrap</option>
                  <option value="Message Card">Message Card</option>
                </select>
              </div>
            </div>
            <div className="cakemodal-actions">
              <button 
                className="cakemodal-add-to-cart-btn cakemodal-black-btn"
                onClick={handleAddToCart}
              >
                Add to Basket
              </button>
            </div>
            <div className="cakemodal-ingredients-list">
              <div><b>Ingredients List:</b></div>
              <div>
                {cake.ingredients && cake.ingredients.length > 0 && (
                  <span>{cake.ingredients.join(', ')}</span>
                )}
              </div>
              {cake.toppings && cake.toppings.length > 0 && (
                <div><b>Toppings:</b> {cake.toppings.join(', ')}</div>
              )}
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="cakemodal-related-products">
            <h3>Related products</h3>
            <div className="cakemodal-related-grid">
              {relatedProducts.map(prod => (
                <div key={prod.id} className="cakemodal-related-card">
                  <img src={prod.image} alt={prod.name} />
                  <div className="cakemodal-related-info">
                    <div className="cakemodal-related-title">{prod.name}</div>
                    <div className="cakemodal-related-desc">{prod.description}</div>
                    <div className="cakemodal-related-price">£{(prod.sizes && prod.sizes[0]?.price ? prod.sizes[0].price.toFixed(2) : '0.00')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Reviews Section */}
        <div className="cakemodal-reviews">
          <h3>Customer Reviews</h3>
          <div className="cakemodal-rating">
            <div className="stars-container">
              {renderStars(averageRating)}
            </div>
            <span className="rating-text">
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
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
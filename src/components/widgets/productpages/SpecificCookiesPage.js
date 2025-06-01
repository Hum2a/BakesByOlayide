import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../../firebase/firebase';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import { FaStar, FaStarHalf, FaCheck } from 'react-icons/fa';
import '../../styles/SpecificCakePage.css';

const SpecificCookiesPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [cookie, setCookie] = useState(null);
  const [allCookies, setAllCookies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedFlavourIdx, setSelectedFlavourIdx] = useState(0);
  const [decorationStyle, setDecorationStyle] = useState('');
  const [decorationStylePrice, setDecorationStylePrice] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [addOns, setAddOns] = useState([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCookie = async () => {
      setLoading(true);
      try {
        const cookieRef = doc(db, 'cakes', id);
        const cookieSnap = await getDoc(cookieRef);
        if (cookieSnap.exists()) {
          const cookieData = { id: cookieSnap.id, ...cookieSnap.data() };
          setCookie(cookieData);
          // Set add-ons from Firebase
          if (cookieData.addOns && Array.isArray(cookieData.addOns)) {
            setAddOns(cookieData.addOns);
          }
        }
        // Fetch all cookies for related products
        const cakesCol = collection(db, 'cakes');
        const cakesQuery = query(cakesCol);
        const cakesSnap = await getDocs(cakesQuery);
        setAllCookies(cakesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(cake => Array.isArray(cake.categories) && cake.categories.includes('Cookies')));
      } catch (err) {
        setCookie(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCookie();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const reviewsRef = collection(db, 'cakes', id, 'reviews');
        const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(reviewsQuery);
        const reviewsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReviews(reviewsData);
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(totalRating / reviewsData.length);
        }
      } catch (error) {
        setReviews([]);
      }
    };
    fetchReviews();
  }, [id]);

  if (loading) return (
    <div className="specific-cake-loading-container">
      <div className="specific-cake-spinner"></div>
      <div className="specific-cake-loading-text">Loading...</div>
    </div>
  );
  if (!cookie) return <div>Cookie not found.</div>;

  const sizeOptions = Array.isArray(cookie.sizes) ? cookie.sizes : [];
  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };
  const flavourOptions = Array.isArray(cookie.flavours) ? cookie.flavours : [];
  const selectedFlavour = flavourOptions[selectedFlavourIdx] || '';
  const minPrice = sizeOptions.length > 0 ? Math.min(...sizeOptions.map(s => s.price)) : 0;
  const totalPrice = (selectedSize.price || 0) + (decorationStylePrice || 0) + (getAddonPrice(selectedAddons.join(',')) || 0);
  const maxQuantity = cookie.maxQuantity ? parseInt(cookie.maxQuantity, 10) : 20;

  const breadcrumbs = [
    'Collections',
    'Cookies',
    cookie.name
  ];
  const relatedProducts = (allCookies || [])
    .filter(c => c.id !== cookie.id)
    .slice(0, 3);

  const images = Array.isArray(cookie.images) && cookie.images.length > 0 ? cookie.images : [cookie.image];
  const handlePrevImage = () => {
    setSwipeDirection('left');
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setSwipeDirection('right');
    setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<FaStar key={`star-${i}`} className="star filled" />);
    if (hasHalfStar) stars.push(<FaStarHalf key="half-star" className="star filled" />);
    for (let i = 0; i < 5 - stars.length; i++) stars.push(<FaStar key={`empty-star-${i}`} className="star" />);
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

  const handleAddToCart = () => {
    if (!cookie) return;
    const cartItem = {
      id: `${cookie.id}-${selectedSizeIdx}-${selectedFlavourIdx}`,
      cookieId: cookie.id,
      name: cookie.name,
      image: images[currentImageIdx],
      price: totalPrice,
      quantity: quantity,
      selectedSize: selectedSize,
      selectedFlavour: selectedFlavour,
      decorationStyle: decorationStyle,
      decorationStylePrice: decorationStylePrice,
      addon: selectedAddons.join(','),
      addonPrice: getAddonPrice(selectedAddons.join(',')),
      notes: notes
    };
    addToCart(cartItem);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getAddonPrice = (addon) => {
    const foundAddon = addOns.find(a => a.name === addon);
    return foundAddon ? parseFloat(foundAddon.price) || 0 : 0;
  };

  const handleAddonToggle = (addon) => {
    if (selectedAddons.includes(addon)) {
      setSelectedAddons(selectedAddons.filter(a => a !== addon));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  return (
    <div>
      <Header 
        user={user}
        isScrolled={false}
        isMobileMenuOpen={false}
        handleMobileMenuClick={() => {}}
        handleProfileClick={() => {}}
        handleAuthClick={() => {}}
        isProfileOpen={false}
        setIsProfileOpen={() => {}}
        setIsMobileMenuOpen={() => {}}
        handleModalOpen={() => {}}
      />
      {showSuccess && (
        <div className="add-to-cart-success">
          <FaCheck className="success-icon" />
          <span>Successfully added to cart!</span>
        </div>
      )}
      <div className="specific-cake-container">
        <nav className="specific-cake-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            let href = null;
            if (idx === 0) href = "/collections";
            if (idx === 1) href = "/collections/cookies";
            return (
              <span key={crumb}>
                {idx > 0 && (
                  <span className="cakemodal-breadcrumb-sep-slash">/</span>
                )}
                {href && !isLast ? (
                  <a href={href} className="cakemodal-breadcrumb-link">{crumb}</a>
                ) : (
                  <span className="cakemodal-breadcrumb">{crumb}</span>
                )}
              </span>
            );
          })}
        </nav>
        <div className="specific-cake-grid">
          <div className="specific-cake-image">
            <div className={`carousel-img-wrapper${swipeDirection ? ` swipe-${swipeDirection}` : ''}`}
              key={currentImageIdx}
              onAnimationEnd={() => setSwipeDirection(null)}
            >
              <img src={images[currentImageIdx]} alt={cookie.name} />
            </div>
            {images.length > 1 && (
              <>
                <button className="carousel-arrow left" onClick={handlePrevImage} aria-label="Previous image">&#8592;</button>
                <button className="carousel-arrow right" onClick={handleNextImage} aria-label="Next image">&#8594;</button>
                <div className="carousel-indicators">
                  {images.map((img, idx) => (
                    <span
                      key={idx}
                      className={`carousel-dot${idx === currentImageIdx ? ' active' : ''}`}
                      onClick={() => {
                        setSwipeDirection(idx > currentImageIdx ? 'right' : 'left');
                        setCurrentImageIdx(idx);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="specific-cake-details">
            <h2>{cookie.name}</h2>
            <p className="specific-cake-subtitle">{cookie.subtitle}</p>
            <p className="specific-cake-available-sizes">Available in {sizeOptions.map(s => s.size).join(', ')}</p>
            <p className="specific-cake-price">From £{minPrice.toFixed(2)}</p>
            <p className="specific-cake-description">{cookie.description}</p>
            <div className="specific-cake-selectors">
              {sizeOptions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Batch Size</label>
                  <div className="specific-cake-selector-options">
                    {sizeOptions.map((size, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-selector-btn ${selectedSizeIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedSizeIdx(idx)}
                      >
                        {size.size} cookies
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(flavourOptions) && flavourOptions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Flavour</label>
                  <div className="specific-cake-selector-options">
                    {flavourOptions.map((flavour, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-selector-btn ${selectedFlavourIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedFlavourIdx(idx)}
                      >
                        {flavour.name}
                        {flavour.price ? ` (+£${Number(flavour.price).toFixed(2)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="specific-cake-selector-group quantity-selector-group">
                <label className="specific-cake-selector-label">Quantity</label>
                <div className="quantity-selector">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              {cookie.decorationStyles && cookie.decorationStyles.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Decoration Style</label>
                  <select
                    className="specific-cake-dropdown"
                    value={decorationStyle}
                    onChange={(e) => {
                      const selected = cookie.decorationStyles.find(t => t.name === e.target.value);
                      setDecorationStyle(e.target.value);
                      setDecorationStylePrice(selected ? Number(selected.price) : 0);
                    }}
                  >
                    <option value="">Choose a style</option>
                    {cookie.decorationStyles.map((style, idx) => (
                      <option key={idx} value={style.name}>
                        {style.name} {style.price ? `(+£${Number(style.price).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {cookie.addOns && cookie.addOns.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Add Ons</label>
                  <div className="specific-cake-addons-container">
                    {cookie.addOns.map((addOn, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-addon-toggle ${selectedAddons.includes(addOn.name) ? 'selected' : ''}`}
                        onClick={() => handleAddonToggle(addOn.name)}
                      >
                        <span className="addon-name">{addOn.name}</span>
                        {/* <span className="addon-price">£{parseFloat(addOn.price).toFixed(2)}</span> */}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="specific-cake-textareas-row">
              <div className="specific-cake-textarea-group">
                <label className="specific-cake-textarea-label">Special Instructions</label>
                <textarea
                  className="specific-cake-textarea"
                  placeholder="Any special requests or dietary requirements?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="specific-cake-total-price">
              Total: £{totalPrice.toFixed(2)}
            </div>
            <button className="specific-cake-add-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
            {cookie.ingredients && (
              <div className="specific-cake-ingredients-list">
                <b>Ingredients:</b> {cookie.ingredients.join(', ')}
              </div>
            )}
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="specific-cake-related-products">
            <h3>You may also like</h3>
            <div className="specific-cake-related-grid">
              {relatedProducts.map((related) => (
                <div key={related.id} className="specific-cake-related-card">
                  <img src={related.image} alt={related.name} />
                  <div className="specific-cake-related-info">
                    <h4 className="specific-cake-related-title">{related.name}</h4>
                    <p className="specific-cake-related-desc">{related.description}</p>
                    <span className="specific-cake-related-price">
                      From £{Math.min(...(related.sizes || []).map(s => s.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="specific-cake-reviews">
          <h3>Customer Reviews</h3>
          {reviews.length > 0 ? (
            <>
              <div className="specific-cake-rating">
                <div className="stars-container">
                  {renderStars(averageRating)}
                </div>
                <span className="rating-text">
                  {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
                </span>
              </div>
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">{review.reviewerName}</span>
                        <span className="review-date">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="review-text">{review.comment}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-reviews">
              No reviews yet. Be the first to review this product!
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SpecificCookiesPage;

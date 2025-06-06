import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../../firebase/firebase';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ProfileDropdown from '../../widgets/ProfileDropdown';
import { FaStar, FaStarHalf, FaCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../styles/SpecificCakePage.css';

const SpecificCupcakePage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [cupcake, setCupcake] = useState(null);
  const [allCupcakes, setAllCupcakes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [topper, setTopper] = useState('');
  const [topperPrice, setTopperPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [decorationStyle, setDecorationStyle] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Header modal states
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Header modal handlers
  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleAuthClick = () => {
    setIsAuthOpen(true);
  };

  const handleModalOpen = (modalType) => {
    switch (modalType) {
      case 'auth':
        setIsAuthOpen(true);
        break;
      case 'profile':
        setIsProfileOpen(true);
        break;
      default:
        break;
    }
  };

  // Handle scroll for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCupcake = async () => {
      setLoading(true);
      try {
        const cupcakeRef = doc(db, 'cakes', id);
        const cupcakeSnap = await getDoc(cupcakeRef);
        if (cupcakeSnap.exists()) {
          const cupcakeData = { id: cupcakeSnap.id, ...cupcakeSnap.data() };
          setCupcake(cupcakeData);
          // Set add-ons from Firebase
          if (cupcakeData.addOns && Array.isArray(cupcakeData.addOns)) {
            setAddOns(cupcakeData.addOns);
          }
        }
        // Fetch all cupcakes for related products
        const cakesCol = collection(db, 'cakes');
        const cakesQuery = query(cakesCol);
        const cakesSnap = await getDocs(cakesQuery);
        setAllCupcakes(cakesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setCupcake(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCupcake();
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
  if (!cupcake) return <div>Cupcake not found.</div>;

  const images = Array.isArray(cupcake.images) && cupcake.images.length > 0 ? cupcake.images : [cupcake.image];
  const handlePrevImage = () => {
    setSwipeDirection('left');
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setSwipeDirection('right');
    setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const sizeOptions = Array.isArray(cupcake.sizes) ? cupcake.sizes : [];
  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      if (prev.includes(addon)) {
        return prev.filter(a => a !== addon);
      } else {
        return [...prev, addon];
      }
    });
  };

  const getAddonPrice = (addon) => {
    const foundAddon = addOns.find(a => a.name === addon);
    return foundAddon ? parseFloat(foundAddon.price) || 0 : 0;
  };

  const calculateTotalAddonPrice = () => {
    return selectedAddons.reduce((total, addon) => total + getAddonPrice(addon), 0);
  };

  const handleTopperChange = (e) => {
    const selectedTopper = cupcake.toppers.find(t => t.name === e.target.value);
    setTopper(e.target.value);
    setTopperPrice(selectedTopper && !isNaN(Number(selectedTopper.price)) ? Number(selectedTopper.price) : 0);
  };

  const selectedFlavour = cupcake.flavourOptions ? cupcake.flavourOptions[selectedSizeIdx] || '' : '';

  const totalPrice =
    Number(selectedSize.price || 0) +
    Number(topperPrice || 0) +
    Number(calculateTotalAddonPrice ? calculateTotalAddonPrice() : 0) +
    (selectedFlavour && selectedFlavour.price ? Number(selectedFlavour.price) : 0);

  const mainCategory = 'Cupcakes';
  const breadcrumbs = [
    'Collections',
    mainCategory,
    cupcake.name
  ];
  const relatedProducts = (allCupcakes || [])
    .filter(c => c.id !== cupcake.id && c.categories && c.categories.includes(mainCategory))
    .slice(0, 6);

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

  const minPrice = Array.isArray(cupcake.sizes) && cupcake.sizes.length > 0
    ? Math.min(...cupcake.sizes.map(s => s.price))
    : 0;

  const handleAddToCart = () => {
    if (!cupcake) return;

    const cartItem = {
      id: `${cupcake.id}-${selectedSizeIdx}`,
      cupcakeId: cupcake.id,
      name: cupcake.name,
      image: cupcake.image,
      price: totalPrice,
      quantity: quantity,
      selectedSize: selectedSize,
      topper: topper,
      topperPrice: topperPrice,
      occasion: occasion,
      addons: selectedAddons,
      addonPrices: selectedAddons.map(addon => ({
        name: addon,
        price: getAddonPrice(addon)
      })),
      decorationStyle: decorationStyle,
      notes: notes
    };

    addToCart(cartItem);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div>
      <Header 
        user={user}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        handleMobileMenuClick={handleMobileMenuClick}
        handleProfileClick={handleProfileClick}
        handleAuthClick={handleAuthClick}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleModalOpen={handleModalOpen}
        isAuthOpen={isAuthOpen}
        setIsAuthOpen={setIsAuthOpen}
      />
      <ProfileDropdown
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onModalOpen={handleModalOpen}
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
            if (idx === 1) href = "/collections/cupcakes";
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
            <div className="listing-carousel-container">
              {images.length > 1 && (
                <button className="listing-carousel-arrow left" onClick={handlePrevImage} aria-label="Previous image">
                  <FaChevronLeft size={38} color="#fff" />
                </button>
              )}
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`listing-carousel-slide${idx === currentImageIdx ? ' active' : ''}${idx === (currentImageIdx - 1 + images.length) % images.length ? ' prev' : ''}`}
                  style={{ display: idx === currentImageIdx || idx === (currentImageIdx - 1 + images.length) % images.length ? 'flex' : 'none' }}
                >
                  <img src={img} alt={cupcake.name} />
                </div>
              ))}
              {images.length > 1 && (
                <button className="listing-carousel-arrow right" onClick={handleNextImage} aria-label="Next image">
                  <FaChevronRight size={38} color="#fff" />
                </button>
              )}
            </div>
            {images.length > 1 && (
              <div className="listing-carousel-dots">
                {images.map((img, idx) => (
                  <span
                    key={idx}
                    className={`listing-carousel-dot${idx === currentImageIdx ? ' active' : ''}`}
                    onClick={() => {
                      setSwipeDirection(idx > currentImageIdx ? 'right' : 'left');
                      setCurrentImageIdx(idx);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="specific-cake-details">
            <h2>{cupcake.name}</h2>
            <p className="specific-cake-subtitle">{cupcake.subtitle}</p>
            <p className="specific-cake-available-sizes">Available in boxes of {sizeOptions.map(s => s.size).join(', ')}</p>
            <p className="specific-cake-price">From £{minPrice.toFixed(2)}</p>
            <p className="specific-cake-description">{cupcake.description}</p>

            <div className="specific-cake-selectors">
              <div className="specific-cake-selector-group">
                <label className="specific-cake-selector-label">Batch Size</label>
                <div className="specific-cake-selector-options">
                  {sizeOptions.map((size, idx) => (
                    <button
                      key={idx}
                      className={`specific-cake-selector-btn ${selectedSizeIdx === idx ? 'selected' : ''}`}
                      onClick={() => setSelectedSizeIdx(idx)}
                    >
                      {size.size} cupcakes
                    </button>
                  ))}
                </div>
              </div>

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
                    onClick={() => setQuantity(Math.min(selectedSize.size, quantity + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {cupcake.decorationStyles && cupcake.decorationStyles.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Decoration Style</label>
                  <select
                    className="specific-cake-dropdown"
                    value={decorationStyle}
                    onChange={(e) => setDecorationStyle(e.target.value)}
                  >
                    <option value="">Choose a style</option>
                    {cupcake.decorationStyles.map((style, idx) => (
                      <option key={idx} value={style.name}>
                        {style.name} {style.price ? `(+£${Number(style.price).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {cupcake.occasions && cupcake.occasions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Occasion</label>
                  <select
                    className="specific-cake-dropdown"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                  >
                    <option value="">No special occasion</option>
                    {cupcake.occasions.map((occasionOption, idx) => (
                      <option key={idx} value={occasionOption.name}>
                        {occasionOption.name} (+£{Number(occasionOption.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {cupcake.toppers && cupcake.toppers.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Topper</label>
                  <select
                    className="specific-cake-dropdown"
                    value={topper}
                    onChange={handleTopperChange}
                  >
                    <option value="">No topper</option>
                    {cupcake.toppers.map((topperOption, idx) => (
                      <option key={idx} value={topperOption.name}>
                        {topperOption.name} (+£{Number(topperOption.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="specific-cake-selector-group">
                <span className="specific-cake-selector-label">Add ons:</span>
                <div className="specific-cake-addons-container">
                  {cupcake.addOns && cupcake.addOns.map((addOn, idx) => (
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
          </div>
        </div>

        <div className="specific-cake-total-price">
          Total: £{totalPrice.toFixed(2)}
        </div>

        <button className="specific-cake-add-btn" onClick={handleAddToCart}>
          Add to Cart
        </button>

        {cupcake.ingredients && (
          <div className="specific-cake-ingredients-list">
            <b>Ingredients:</b> {cupcake.ingredients.join(', ')}
          </div>
        )}

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
                      From £{Math.min(...related.sizes.map(s => s.price)).toFixed(2)}
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

export default SpecificCupcakePage;

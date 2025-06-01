import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../../firebase/firebase';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ProfileDropdown from '../../widgets/ProfileDropdown';
import { FaStar, FaStarHalf, FaCheck } from 'react-icons/fa';
import '../../styles/SpecificCakePage.css';

const SpecificCakePage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [cake, setCake] = useState(null);
  const [allCakes, setAllCakes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState(0);
  const [selectedFinishIdx, setSelectedFinishIdx] = useState(0);
  const [topper, setTopper] = useState('');
  const [topperPrice, setTopperPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [user, setUser] = useState(null);

  // Header modal states
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
    const fetchCake = async () => {
      setLoading(true);
      try {
        const cakeRef = doc(db, 'cakes', id);
        const cakeSnap = await getDoc(cakeRef);
        if (cakeSnap.exists()) {
          const cakeData = { id: cakeSnap.id, ...cakeSnap.data() };
          setCake(cakeData);
          // Set add-ons from Firebase
          if (cakeData.addOns && Array.isArray(cakeData.addOns)) {
            setAddOns(cakeData.addOns);
          }
        }
        // Fetch all cakes for related products
        const cakesCol = collection(db, 'cakes');
        const cakesQuery = query(cakesCol);
        const cakesSnap = await getDocs(cakesQuery);
        setAllCakes(cakesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setCake(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCake();
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
  if (!cake) return <div>Cake not found.</div>;

  const images = Array.isArray(cake.images) && cake.images.length > 0 ? cake.images : [cake.image];
  const handlePrevImage = () => {
    setSwipeDirection('left');
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setSwipeDirection('right');
    setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const sizeOptions = Array.isArray(cake.sizes) ? cake.sizes : [];
  const shapeOptions = Array.isArray(cake.shapes) ? cake.shapes : [];
  const finishOptions = Array.isArray(cake.finishes) ? cake.finishes : [];
  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };
  const selectedShape = shapeOptions[selectedShapeIdx] || { price: 0, name: '' };
  const selectedFinish = finishOptions[selectedFinishIdx] || { price: 0, name: '' };

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

  const totalPrice = (selectedSize.price || 0) + 
                    (selectedShape.price || 0) + 
                    (selectedFinish.price || 0) + 
                    (topperPrice || 0) + 
                    calculateTotalAddonPrice();

  const mainCategory = (cake.categories && cake.categories[0]) || 'Cakes';
  const breadcrumbs = [
    'Collections',
    mainCategory,
    cake.name
  ];
  const relatedProducts = (allCakes || [])
    .filter(c => c.id !== cake.id && c.categories && c.categories.includes(mainCategory))
    .slice(0, 3);

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

  const minPrice = Array.isArray(cake.sizes) && cake.sizes.length > 0
    ? Math.min(...cake.sizes.map(s => s.price))
    : 0;

  const handleAddToCart = () => {
    if (!cake) return;

    const cartItem = {
      id: `${cake.id}-${selectedSizeIdx}-${selectedShapeIdx}-${selectedFinishIdx}`,
      cakeId: cake.id,
      name: cake.name,
      image: cake.image,
      price: totalPrice,
      quantity: 1,
      selectedSize: selectedSize,
      selectedShape: selectedShape,
      selectedFinish: selectedFinish,
      topper: topper,
      topperPrice: topperPrice,
      occasion: occasion,
      addons: selectedAddons,
      addonPrices: selectedAddons.map(addon => ({
        name: addon,
        price: getAddonPrice(addon)
      })),
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
            // Determine if this is the last crumb
            const isLast = idx === breadcrumbs.length - 1;
            // Determine link for each crumb
            let href = null;
            if (idx === 0) href = "/collections";
            if (idx === 1) {
              // Convert mainCategory to kebab case for the URL
              const slug = mainCategory
                .toLowerCase()
                .replace(/\s+/g, '-')  // Replace spaces with hyphens
                .replace(/[^a-z0-9-]/g, '') // Remove any non-alphanumeric characters except hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
              href = `/collections/${slug}`;
            }
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
              <img src={images[currentImageIdx]} alt={cake.name} />
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
            <h2>{cake.name}</h2>
            {cake.subtitle && <div className="specific-cake-subtitle">{cake.subtitle}</div>}
            <div className="specific-cake-available-sizes">
              {sizeOptions.length > 0 && (
                <span>Available in {sizeOptions.map(s => `${s.size}\"`).join(', ')}</span>
              )}
            </div>
            <div className="specific-cake-price-row">
              <span className="specific-cake-price">From £{totalPrice.toFixed(2)}</span>
            </div>
            <div className="specific-cake-description">{cake.description}</div>
            <div className="specific-cake-selectors">
              {sizeOptions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <span className="specific-cake-selector-label">Size:</span>
                  <div className="specific-cake-selector-options">
                    {sizeOptions.map((size, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-selector-btn${selectedSizeIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedSizeIdx(idx)}
                      >
                        {size.size}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {shapeOptions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <span className="specific-cake-selector-label">Shape:</span>
                  <div className="specific-cake-selector-options">
                    {shapeOptions.map((shape, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-selector-btn${selectedShapeIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedShapeIdx(idx)}
                      >
                        {shape.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {finishOptions.length > 0 && (
                <div className="specific-cake-selector-group">
                  <span className="specific-cake-selector-label">Finish:</span>
                  <div className="specific-cake-selector-options">
                    {finishOptions.map((finish, idx) => (
                      <button
                        key={idx}
                        className={`specific-cake-selector-btn${selectedFinishIdx === idx ? ' selected' : ''}`}
                        onClick={() => setSelectedFinishIdx(idx)}
                      >
                        {finish.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="specific-cake-selector-group">
                <span className="specific-cake-selector-label">Occasion:</span>
                <select
                  className="specific-cake-dropdown"
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
              {cake.toppers && cake.toppers.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Topper</label>
                  <select
                    className="specific-cake-dropdown"
                    value={topper}
                    onChange={e => {
                      const selectedTopper = cake.toppers.find(t => t.name === e.target.value);
                      setTopper(e.target.value);
                      setTopperPrice(selectedTopper ? selectedTopper.price : 0);
                    }}
                  >
                    <option value="">No topper</option>
                    {cake.toppers.map((topperOption, idx) => (
                      <option key={idx} value={topperOption.name}>
                        {topperOption.name} (+£{Number(topperOption.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {addOns && addOns.length > 0 && (
                <div className="specific-cake-selector-group">
                  <span className="specific-cake-selector-label">Add ons:</span>
                  <div className="specific-cake-addons-container">
                    {addOns.map((addon) => (
                      <button
                        key={addon.name}
                        className={`specific-cake-addon-toggle ${selectedAddons.includes(addon.name) ? 'selected' : ''}`}
                        onClick={() => handleAddonToggle(addon.name)}
                      >
                        <span className="addon-name">{addon.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="specific-cake-textareas-row">
          <div className="specific-cake-textarea-group">
            <label className="specific-cake-textarea-label">Design Inspirations: (Optional)</label>
            <input type="file" className="specific-cake-textarea" />
          </div>
          <div className="specific-cake-textarea-group">
            <label className="specific-cake-textarea-label">Additional Notes: (Optional)</label>
            <textarea
              className="specific-cake-textarea"
              placeholder="Type here"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="specific-cake-total-price">
          Total Price: £{totalPrice.toFixed(2)}
        </div>
        <button className="specific-cake-add-btn" onClick={handleAddToCart}>Add to Basket</button>
        <div className="specific-cake-ingredients-list">
          <div><b>Ingredients List:</b></div>
          <div>
            {cake.ingredients && cake.ingredients.length > 0 && (
              cake.ingredients.map((ingredient, index) => {
                const allergens = [
                  'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
                  'wheat', 'soy', 'sesame', 'gluten', 'nuts', 'dairy'
                ];
                // Replace allergen words with bolded spans
                let formatted = ingredient;
                allergens.forEach(allergen => {
                  const regex = new RegExp(`\\b${allergen}\\b`, 'gi');
                  formatted = formatted.replace(regex, match => `<span class='allergen'>${match}</span>`);
                });
                return (
                  <span key={index}>
                    <span dangerouslySetInnerHTML={{ __html: formatted }} />
                    {index < cake.ingredients.length - 1 ? ', ' : ''}
                  </span>
                );
              })
            )}
          </div>
          {cake.toppings && cake.toppings.length > 0 && (
            <div>
              <b>Toppings:</b>{' '}
              {cake.toppings.map((topping, index) => {
                const allergens = [
                  'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
                  'wheat', 'soy', 'sesame', 'gluten', 'nuts', 'dairy'
                ];
                let formatted = topping;
                allergens.forEach(allergen => {
                  const regex = new RegExp(`\\b${allergen}\\b`, 'gi');
                  formatted = formatted.replace(regex, match => `<span class='allergen'>${match}</span>`);
                });
                return (
                  <span key={index}>
                    <span dangerouslySetInnerHTML={{ __html: formatted }} />
                    {index < cake.toppings.length - 1 ? ', ' : ''}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {relatedProducts.length > 0 && (
          <div className="specific-cake-related-products">
            <h3>Related products</h3>
            <div className="specific-cake-related-grid">
              {relatedProducts.map(prod => (
                <div key={prod.id} className="specific-cake-related-card">
                  <img src={prod.image} alt={prod.name} />
                  <div className="specific-cake-related-info">
                    <div className="specific-cake-related-title">{prod.name}</div>
                    <div className="specific-cake-related-desc">{prod.description}</div>
                    <div className="specific-cake-related-price">£{(prod.sizes && prod.sizes[0]?.price ? prod.sizes[0].price.toFixed(2) : '0.00')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Reviews Section */}
        <div className="specific-cake-reviews">
          <h3>Customer Reviews</h3>
          <div className="specific-cake-rating">
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
      <Footer />
    </div>
  );
};

export default SpecificCakePage;

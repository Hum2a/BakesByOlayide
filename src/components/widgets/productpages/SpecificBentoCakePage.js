import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../../firebase/firebase';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import { FaStar, FaStarHalf, FaCheck } from 'react-icons/fa';
import '../../styles/SpecificCakePage.css';

const SpecificBentoCakePage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [bento, setBento] = useState(null);
  const [allBentos, setAllBentos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedFlavourIdx, setSelectedFlavourIdx] = useState(0);
  const [topper, setTopper] = useState('');
  const [topperPrice, setTopperPrice] = useState(0);
  const [decorationStyle, setDecorationStyle] = useState('');
  const [decorationStylePrice, setDecorationStylePrice] = useState(0);
  const [addon, setAddon] = useState('');
  const [addonPrice, setAddonPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

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
      case 'auth': setIsAuthOpen(true); break;
      case 'profile': setIsProfileOpen(true); break;
      default: break;
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchBento = async () => {
      setLoading(true);
      try {
        const bentoRef = doc(db, 'cakes', id);
        const bentoSnap = await getDoc(bentoRef);
        if (bentoSnap.exists()) {
          setBento({ id: bentoSnap.id, ...bentoSnap.data() });
        }
        // Fetch all bentos for related products
        const bentosCol = collection(db, 'cakes');
        const bentosQuery = query(bentosCol);
        const bentosSnap = await getDocs(bentosQuery);
        setAllBentos(bentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setBento(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBento();
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

  if (loading) return <div>Loading...</div>;
  if (!bento) return <div>Bento Cake not found.</div>;

  const sizeOptions = Array.isArray(bento.sizes) ? bento.sizes : [];
  const selectedSize = sizeOptions[selectedSizeIdx] || { price: 0, size: '' };
  const flavourOptions = Array.isArray(bento.flavours) ? bento.flavours : [];
  const selectedFlavour = flavourOptions[selectedFlavourIdx] || '';
  const minPrice = sizeOptions.length > 0 ? Math.min(...sizeOptions.map(s => s.price)) : 0;
  const totalPrice = (selectedSize.price || 0) + (topperPrice || 0) + (decorationStylePrice || 0) + (addonPrice || 0);

  const breadcrumbs = [
    'Collections',
    'Bento Cakes',
    bento.name
  ];
  const relatedProducts = (allBentos || [])
    .filter(c => c.id !== bento.id)
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

  const handleAddToCart = () => {
    if (!bento) return;
    const cartItem = {
      id: `${bento.id}-${selectedSizeIdx}-${selectedFlavourIdx}`,
      bentoId: bento.id,
      name: bento.name,
      image: bento.image,
      price: totalPrice,
      quantity: quantity,
      selectedSize: selectedSize,
      selectedFlavour: selectedFlavour,
      topper: topper,
      topperPrice: topperPrice,
      decorationStyle: decorationStyle,
      decorationStylePrice: decorationStylePrice,
      addon: addon,
      addonPrice: addonPrice,
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
            if (idx === 1) href = "/collections/bento-cake-with-cupcakes";
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
            <img src={bento.image} alt={bento.name} />
          </div>
          <div className="specific-cake-details">
            <h2>{bento.name}</h2>
            <p className="specific-cake-subtitle">{bento.subtitle}</p>
            <p className="specific-cake-available-sizes">Available in boxes of {sizeOptions.map(s => s.size).join(', ')}</p>
            <p className="specific-cake-price">From £{minPrice.toFixed(2)}</p>
            <p className="specific-cake-description">{bento.description}</p>
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
                        {size.size} cupcakes
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
                    onClick={() => setQuantity(Math.min(selectedSize.size, quantity + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              {bento.decorationStyles && bento.decorationStyles.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Decoration Style</label>
                  <select
                    className="specific-cake-dropdown"
                    value={decorationStyle}
                    onChange={(e) => {
                      const selected = bento.decorationStyles.find(t => t.name === e.target.value);
                      setDecorationStyle(e.target.value);
                      setDecorationStylePrice(selected ? Number(selected.price) : 0);
                    }}
                  >
                    <option value="">Choose a style</option>
                    {bento.decorationStyles.map((style, idx) => (
                      <option key={idx} value={style.name}>
                        {style.name} {style.price ? `(+£${Number(style.price).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {Array.isArray(bento.toppers) && bento.toppers.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Topper</label>
                  <select
                    className="specific-cake-dropdown"
                    value={topper}
                    onChange={(e) => {
                      const selected = bento.toppers.find(t => t.name === e.target.value);
                      setTopper(e.target.value);
                      setTopperPrice(selected ? Number(selected.price) : 0);
                    }}
                  >
                    <option value="">No topper</option>
                    {bento.toppers.map((topperOption, idx) => (
                      <option key={idx} value={topperOption.name}>
                        {topperOption.name} {topperOption.price ? `(+£${Number(topperOption.price).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {bento.addOns && bento.addOns.length > 0 && (
                <div className="specific-cake-selector-group">
                  <label className="specific-cake-selector-label">Add Ons</label>
                  <select
                    className="specific-cake-dropdown"
                    value={addon}
                    onChange={(e) => {
                      const selected = bento.addOns.find(a => a.name === e.target.value);
                      setAddon(e.target.value);
                      setAddonPrice(selected ? Number(selected.price) : 0);
                    }}
                  >
                    <option value="">Choose</option>
                    {bento.addOns.map((addOn, idx) => (
                      <option key={idx} value={addOn.name}>
                        {addOn.name} {addOn.price ? `(+£${Number(addOn.price).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
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
          </div>
        </div>

        <div className="specific-cake-total-price">
            Total: £{totalPrice.toFixed(2)}
        </div>
        <button className="specific-cake-add-btn" onClick={handleAddToCart}>
            Add to Cart
        </button>
        {bento.ingredients && (
            <div className="specific-cake-ingredients-list">
            <b>Ingredients:</b> {bento.ingredients.join(', ')}
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

export default SpecificBentoCakePage;

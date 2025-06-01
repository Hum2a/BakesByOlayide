import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../../stripe/config';
import StripePaymentForm from '../payment/StripePaymentForm';
import { auth, db } from '../../firebase/firebase';
import { doc, setDoc, collection, getDocs, query, where, Timestamp, increment, getDoc } from 'firebase/firestore';
import '../styles/Checkout.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import AuthModal from '../modals/AuthModal';
import { loadStripe } from '@stripe/stripe-js';

const GuestForm = ({ onSubmit, isLoading }) => (
  <form onSubmit={onSubmit} className="guest-form">
    <div className="form-group">
      <label htmlFor="name">Full Name *</label>
      <input
        type="text"
        id="name"
        name="name"
        required
        placeholder="Enter your full name"
      />
    </div>
    <div className="form-group">
      <label htmlFor="email">Email Address *</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="Enter your email address"
      />
    </div>
    <div className="form-group">
      <label htmlFor="phone">Phone Number *</label>
      <input
        type="tel"
        id="phone"
        name="phone"
        required
        placeholder="Enter your phone number"
      />
    </div>
    <button type="submit" className="continue-button" disabled={isLoading}>
      Continue to Payment
    </button>
  </form>
);

const PickupSchedule = ({ pickupDate, setPickupDate, pickupTime, setPickupTime }) => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const times = [];
    for (let hour = 9; hour <= 19; hour++) {
      times.push(`${hour}:00`);
      if (hour !== 19) times.push(`${hour}:30`);
    }
    setAvailableTimes(times);
    setLoading(false);
  }, []);

  const getDatesForMonth = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const availableDates = getDatesForMonth(displayedMonth);

  const isDateDisabled = (date) => {
    const today = new Date();
    const minPickupDate = new Date(today);
    minPickupDate.setDate(today.getDate() + 5);
    return date < minPickupDate;
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setPickupDate(date.toISOString());
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setPickupTime(time);
  };

  const goToPrevMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthName = displayedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatDatesByWeekMondayStart = (dates) => {
    const weeks = [];
    let currentWeek = [];
    if (dates.length === 0) return weeks;
    const firstDate = new Date(dates[0]);
    let dayOfWeek = firstDate.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(null);
    }
    dates.forEach((date) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    });
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    return weeks;
  };

  if (loading) {
    return <div className="loading">Loading pickup options...</div>;
  }

  const datesByWeek = formatDatesByWeekMondayStart(availableDates);

  return (
    <div className="pickup-schedule">
      <h3 className="pickup-schedule-title">Schedule Order</h3>
      <div className="schedule-grid">
        {/* Calendar and notice */}
        <div>
          <label className="pickup-date-label">Pick-up Date:</label>
          <div className="pickup-notice">
            All orders require a minimum of 5 days notice before pick-up.
          </div>
          {/* Month navigation */}
          <div className="calendar-month-nav">
            <button type="button" onClick={goToPrevMonth} aria-label="Previous Month">&lt;</button>
            <span className="calendar-month-name">{monthName}</span>
            <button type="button" onClick={goToNextMonth} aria-label="Next Month">&gt;</button>
          </div>
          <div className="weekday-header">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
              <div key={day} className="weekday-name">{day}</div>
            ))}
          </div>
          <div className="calendar-month">
            {datesByWeek.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((date, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`calendar-day${date ? '' : ' empty'}${date && isDateDisabled(date) ? ' disabled' : ''}${date && selectedDate && date.toDateString() === selectedDate.toDateString() ? ' selected' : ''}`}
                    onClick={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Time slots */}
        <div>
          <label className="pickup-time-label">Pick-up Time:</label>
          <div className="clock-grid">
            {availableTimes.map((time) => (
              <div
                key={time}
                className={`clock-time${selectedTime === time ? ' selected' : ''}`}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cart, totalPrice, clearCart, updateQuantity, removeFromCart, setCart } = useCart();
  const navigate = useNavigate();
  const [guestInfo, setGuestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [tempCart, setTempCart] = useState(null);
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && tempCart) {
        try {
          // Get user's existing cart from Firestore
          const userCartRef = doc(db, 'users', user.uid, 'cart', 'items');
          const userCartDoc = await getDoc(userCartRef);
          let existingCart = [];
          
          if (userCartDoc.exists()) {
            existingCart = userCartDoc.data().items || [];
          }

          // Merge temp cart with existing cart
          const mergedCart = [...existingCart];
          tempCart.forEach(item => {
            const existingItemIndex = mergedCart.findIndex(
              existingItem => existingItem.id === item.id
            );
            
            if (existingItemIndex >= 0) {
              // Update quantity if item exists
              mergedCart[existingItemIndex].quantity += item.quantity;
            } else {
              // Add new item if it doesn't exist
              mergedCart.push(item);
            }
          });

          // Update cart in context and Firestore
          setCart(mergedCart);
          await setDoc(userCartRef, { items: mergedCart });
          
          // Clear temporary cart
          setTempCart(null);
        } catch (error) {
          console.error('Error merging carts:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [tempCart, setCart]);

  const handleAuthOpen = () => {
    // Store current cart before opening auth modal
    setTempCart(cart);
    setIsAuthOpen(true);
  };

  const handleApplyDiscount = async () => {
    setDiscountError('');
    const code = discountCode.trim().toUpperCase();
    
    if (!code) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsCheckingDiscount(true);
    try {
      // Query the discount code from Firebase
      const discountQuery = query(
        collection(db, 'Discount Codes'),
        where('code', '==', code)
      );
      const discountSnapshot = await getDocs(discountQuery);

      if (discountSnapshot.empty) {
        setDiscountError('Invalid discount code');
        setAppliedDiscount(null);
        return;
      }

      const discountDoc = discountSnapshot.docs[0];
      const discountData = discountDoc.data();

      // Validate if the discount is active
      if (!discountData.isActive) {
        setDiscountError('This discount code is no longer active');
        setAppliedDiscount(null);
        return;
      }

      // Check expiry date if it exists
      if (discountData.expiryDate) {
        const expiryDate = new Date(discountData.expiryDate);
        const now = new Date();
        if (expiryDate < now) {
          setDiscountError('This discount code has expired');
          setAppliedDiscount(null);
          return;
        }
      }

      // Check minimum purchase requirement if it exists
      if (discountData.minPurchase && totalPrice < discountData.minPurchase) {
        setDiscountError(`Minimum purchase of £${discountData.minPurchase.toFixed(2)} required`);
        setAppliedDiscount(null);
        return;
      }

      // Calculate discount amount
      let discountAmount = (totalPrice * discountData.percentage) / 100;

      // Apply maximum discount limit if it exists
      if (discountData.maxDiscount && discountAmount > discountData.maxDiscount) {
        discountAmount = discountData.maxDiscount;
      }

      // Validate that the discount amount is positive
      if (discountAmount <= 0) {
        setDiscountError('Invalid discount amount');
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount({
        id: discountDoc.id,
        code: discountData.code,
        percentage: discountData.percentage,
        description: discountData.description,
        amount: discountAmount
      });
      setDiscountCode(''); // Clear the input

    } catch (error) {
      console.error('Error checking discount code:', error);
      setDiscountError('Error validating discount code. Please try again.');
      setAppliedDiscount(null);
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const calculateDiscountAmount = () => {
    return appliedDiscount ? appliedDiscount.amount : 0;
  };

  const finalPrice = totalPrice - calculateDiscountAmount();

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Please add some items to your cart before proceeding to checkout.</p>
        <button onClick={() => navigate('/collections')} className="return-to-shop">
          Return to Shop
        </button>
      </div>
    );
  }

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setGuestInfo({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone')
    });
  };

  const handleStripeCheckout = async () => {
    try {
      setIsLoading(true);

      // 1. Generate a new order ID in the format ORD-{timestamp}-{randomString}
      const randomString = Math.random().toString(36).substring(2, 10);
      const orderId = `ORD-${Date.now()}-${randomString}`;

      // 2. Prepare order data
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      const userEmail = auth.currentUser ? auth.currentUser.email : null;
      // Format pickupDate as YYYY-MM-DD only
      let formattedPickupDate = pickupDate;
      if (pickupDate) {
        try {
          const dateObj = new Date(pickupDate);
          formattedPickupDate = dateObj.toISOString().slice(0, 10);
        } catch (e) {}
      }
      const orderData = {
        orderId,
        items: cart,
        total: totalPrice,
        guestInfo,
        pickupDate: formattedPickupDate,
        pickupTime,
        createdAt: Timestamp.now(),
        status: 'pending',
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
      };

      // 3. Prepare invoice data
      const invoiceId = orderId; // Use the same ID for easy lookup
      const invoiceData = {
        invoiceId,
        orderId,
        items: cart.map(item => ({ ...item, total: item.price * item.quantity })),
        amount: totalPrice,
        status: 'unpaid',
        createdAt: Timestamp.now(),
        customerEmail: guestInfo?.email || '',
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
      };

      // 4. Save order and invoice to Firestore
      await setDoc(doc(db, 'orders', orderId), orderData);
      await setDoc(doc(db, 'invoices', invoiceId), invoiceData);
      // Add invoiceRef to the order document
      await setDoc(doc(db, 'orders', orderId), { invoiceRef: `invoices/${invoiceId}` }, { merge: true });
      // 4b. If user is logged in, also save order to /users/{uid}/Orders/{orderId}
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'Orders', orderId), {
          ...orderData,
          invoiceRef: `invoices/${invoiceId}`,
        });
      }

      // 5. Call backend to create Stripe session, passing orderId
      const response = await fetch('https://bakesbyolayide-server.onrender.com/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          guestInfo,
          pickupDate,
          pickupTime,
          orderId, // Pass orderId to backend
        }),
      });
      const { sessionId, error } = await response.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      alert('Error redirecting to Stripe: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <PageTitle title="Checkout" />
      <Header user={user} />
      <div className="checkout-content">
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="checkout-items">
            {cart.map((item) => (
              <div key={item.id} className="checkout-item">
                {/* Left: Image */}
                <div className="checkout-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : null}
                </div>
                {/* Price in top right */}
                <div className="checkout-item-price-absolute">
                  £{item.price.toFixed(2)}
                </div>
                {/* Right: Details */}
                <div className="checkout-item-details">
                  <div className="checkout-item-attributes">
                    <h3>{item.name}</h3>
                    {item.selectedSize && (
                      <div><span className="checkout-attr-label">Size:</span> {item.selectedSize.size}{typeof item.selectedSize.size === 'number' ? '"' : ''}</div>
                    )}
                    {item.batchSize && (
                      <div><span className="checkout-attr-label">Batch Size:</span> {item.batchSize}</div>
                    )}
                    {item.selectedShape && (
                      <div><span className="checkout-attr-label">Shape:</span> {item.selectedShape.name}</div>
                    )}
                    {item.decorationStyle && (
                      <div><span className="checkout-attr-label">Decoration Style:</span> {item.decorationStyle}</div>
                    )}
                    {item.selectedFinish && (
                      <div><span className="checkout-attr-label">Finish:</span> {item.selectedFinish.name}</div>
                    )}
                    {item.occasion && (
                      <div><span className="checkout-attr-label">Occasion:</span> {item.occasion}</div>
                    )}
                    {item.topper && (
                      <div><span className="checkout-attr-label">Topper:</span> {item.topper}</div>
                    )}
                    {item.addon && (
                      <div><span className="checkout-attr-label">Add ons:</span> {Array.isArray(item.addon) ? item.addon.join(', ') : item.addon}</div>
                    )}
                    {item.notes && (
                      <div className="checkout-additional-notes"><span className="checkout-attr-label">Additional Notes:</span> <span className="checkout-notes-text">{item.notes}</span></div>
                    )}
                  </div>
                  <div className="checkout-item-meta">
                    {item.designInspiration && (
                      <div className="checkout-design-inspiration"><span className="checkout-attr-label">Design Inspirations:</span><br />{item.designInspiration}</div>
                    )}
                  </div>
                </div>
                {/* Actions in bottom right */}
                <div className="checkout-item-actions">
                  <Link to={`/change/${item.id}`} className="checkout-change-link">Change</Link>
                  <div className="checkout-item-quantity-controls">
                    <span className="checkout-quantity-label">Quantity:</span>
                    <button 
                      className="checkout-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="checkout-quantity">{item.quantity}</span>
                    <button 
                      className="checkout-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Show pickup date and time if selected */}
          {(pickupDate || pickupTime) && (
            <div className="checkout-pickup-info" style={{ margin: '1.5rem 0', padding: '1rem', background: '#fffbe6', borderRadius: 8, fontSize: '1.1rem', color: '#333' }}>
              <b>Pickup Details:</b><br />
              {pickupDate && <span>Date: {new Date(pickupDate).toLocaleDateString()}</span>}
              {pickupDate && pickupTime && <span> &nbsp;|&nbsp; </span>}
              {pickupTime && <span>Time: {pickupTime}</span>}
            </div>
          )}
          <div className="add-more-items">
            <button 
              onClick={() => navigate('/collections')} 
              className="add-more-button"
            >
              Add More Items
            </button>
          </div>
          <div className="checkout-totals" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #eee' }}>
            <div className="total-row">
              <span>Subtotal:</span>
              <span>£{totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="discount-section">
              {!appliedDiscount ? (
                <>
                  <div className="discount-input-group">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter discount code"
                      className="discount-input"
                      disabled={isCheckingDiscount}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      className={`apply-discount-btn ${isCheckingDiscount ? 'loading' : ''}`}
                      type="button"
                      disabled={isCheckingDiscount}
                    >
                      {isCheckingDiscount ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && (
                    <div className="discount-error">
                      <span className="error-icon">⚠️</span>
                      {discountError}
                    </div>
                  )}
                </>
              ) : (
                <div className="applied-discount">
                  <div className="discount-info">
                    <span className="discount-label">
                      Discount Applied: {appliedDiscount.description}
                    </span>
                    <span className="discount-amount">
                      -£{appliedDiscount.amount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="remove-discount-btn"
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="total-row grand-total">
              <span>Total</span>
              <span>${finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!auth.currentUser && !guestInfo ? (
          <div className="auth-section">
            <h2>Account Options</h2>
            <div className="auth-options">
              <div className="login-option">
                <h3>Have an account?</h3>
                <p>Sign in to access your saved information and track your orders.</p>
                <button onClick={handleAuthOpen} className="login-button">Sign In</button>
              </div>
              <div className="guest-option">
                <h3>Continue as Guest</h3>
                <p>You can place your order without creating an account.</p>
                <GuestForm onSubmit={handleGuestSubmit} isLoading={isLoading} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {guestInfo && (
              <div className="guest-info-summary">
                <h3>Order Information</h3>
                <p>Name: {guestInfo.name}</p>
                <p>Email: {guestInfo.email}</p>
                <p>Phone: {guestInfo.phone}</p>
                <button 
                  onClick={() => setGuestInfo(null)} 
                  className="edit-info-button"
                >
                  Edit Information
                </button>
              </div>
            )}
            <PickupSchedule
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
            />
            <button
              className="checkout-stripe-btn"
              onClick={handleStripeCheckout}
              disabled={isLoading}
            >
              {isLoading ? 'Redirecting to Stripe...' : 'Pay with Card (Stripe Checkout)'}
            </button>
          </div>
        )}
      </div>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Checkout; 
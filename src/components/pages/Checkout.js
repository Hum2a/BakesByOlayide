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
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    // Generate dates for the next month (including next 3 days that will be disabled)
    const dates = [];
    const today = new Date();
    
    // Calculate the end date (45 days from today to show plenty of future dates)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 45);

    // Generate all dates from tomorrow until end date
    let currentDate = new Date(today);
    currentDate.setDate(today.getDate() + 1);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setAvailableDates(dates);

    // Generate available times (9 AM to 5 PM)
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      times.push(`${hour}:00`);
      times.push(`${hour}:30`);
    }
    setAvailableTimes(times);
    setLoading(false);
  }, []);

  const isDateDisabled = (date) => {
    const today = new Date();
    const minPickupDate = new Date(today);
    minPickupDate.setDate(today.getDate() + 3);
    return date < minPickupDate;
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setPickupDate(date.toISOString());
      setShowCalendar(false);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setPickupTime(time);
    setShowClock(false);
  };

  const formatDatesByWeek = (dates) => {
    const weeks = [];
    let currentWeek = [];
    
    if (dates.length === 0) return weeks;

    // Get the first date's week start (Sunday)
    const firstDate = new Date(dates[0]);
    const daysUntilSunday = firstDate.getDay();
    
    // Add empty slots for days before the first date
    for (let i = 0; i < daysUntilSunday; i++) {
      currentWeek.push(null);
    }

    dates.forEach((date) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    });

    // Fill the last week with null values if needed
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);

    return weeks;
  };

  if (loading) {
    return <div className="loading">Loading pickup options...</div>;
  }

  const datesByWeek = formatDatesByWeek(availableDates);

  return (
    <div className="pickup-schedule">
      <h3>Schedule Pickup</h3>
      <div className="schedule-grid">
        <div className="form-group">
          <label htmlFor="pickupDate">Pickup Date *</label>
          <div className="custom-picker">
            <div 
              className="picker-input"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }) : 'Select a date'}
              <span className="picker-icon">📅</span>
            </div>
            {showCalendar && (
              <div className="calendar-popup">
                <div className="calendar-header">
                  <h4>Select Pickup Date</h4>
                  <button 
                    className="close-popup"
                    onClick={() => setShowCalendar(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="pickup-notice" style={{ margin: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  Please note: Orders require a minimum of 3 days preparation time.
                </div>
                <div className="weekday-header">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday-name">{day}</div>
                  ))}
                </div>
                <div className="calendar-month">
                  {datesByWeek.map((week, weekIndex) => (
                    <div key={weekIndex} className="calendar-week">
                      {week.map((date, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`calendar-day ${
                            date ? (
                              selectedDate?.toDateString() === date.toDateString() 
                                ? 'selected' 
                                : ''
                            ) : 'empty'
                          } ${date && isDateDisabled(date) ? 'disabled' : ''}`}
                          onClick={() => date && handleDateSelect(date)}
                        >
                          {date && (
                            <>
                              <span className="day-number">
                                {date.getDate()}
                              </span>
                              <span className="month-name">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pickupTime">Pickup Time *</label>
          <div className="custom-picker">
            <div 
              className="picker-input"
              onClick={() => setShowClock(!showClock)}
            >
              {selectedTime || 'Select a time'}
              <span className="picker-icon">⏰</span>
            </div>
            {showClock && (
              <div className="clock-popup">
                <div className="clock-header">
                  <h4>Select Pickup Time</h4>
                  <button 
                    className="close-popup"
                    onClick={() => setShowClock(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="clock-grid">
                  {availableTimes.map((time) => (
                    <div
                      key={time}
                      className={`clock-time ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pickup-notice">
        <p>📍 Pickup Location: 123 Bakery Street, London, UK</p>
        <p>⏰ Store Hours: 9:00 AM - 5:00 PM, Monday to Saturday</p>
        <p>📞 Contact: +44 123 456 7890</p>
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

  // Listen for auth state changes
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
        if (expiryDate < new Date()) {
          setDiscountError('This discount code has expired');
          setAppliedDiscount(null);
          return;
        }
      }

      // Check minimum purchase requirement if it exists
      if (discountData.minPurchase && totalPrice < discountData.minPurchase) {
        setDiscountError(`Minimum purchase of $${discountData.minPurchase} required`);
        setAppliedDiscount(null);
        return;
      }

      // Calculate discount amount
      let discountAmount = (totalPrice * discountData.percentage) / 100;

      // Apply maximum discount limit if it exists
      if (discountData.maxDiscount && discountAmount > discountData.maxDiscount) {
        discountAmount = discountData.maxDiscount;
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
      setDiscountError('Error validating discount code');
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

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setIsLoading(true);
      const orderDate = Timestamp.now();
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userId = auth.currentUser?.uid || null;
      const invoiceRef = userId
        ? `/users/${userId}/Invoices/INV-${orderId}`
        : null;
      const now = Timestamp.now();

      // Build order items
      const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        selectedSize: item.selectedSize,
        selectedShape: item.selectedShape,
        notes: item.notes || '',
        selectedFinish: item.selectedFinish,
        topper: item.topper,
        topperPrice: item.topperPrice,
        occasion: item.occasion,
        addon: item.addon
      }));

      // Build order object
      const order = {
        id: orderId,
        userId: userId,
        items: orderItems,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: paymentIntent.id,
        subtotal: totalPrice,
        discount: appliedDiscount ? {
          id: appliedDiscount.id,
          code: appliedDiscount.code,
          amount: appliedDiscount.amount
        } : null,
        total: finalPrice,
        createdAt: orderDate,
        updatedAt: now,
        pickupStatus: 'scheduled',
        pickupDate: pickupDate ? Timestamp.fromDate(new Date(pickupDate)) : null,
        pickupTime: pickupTime || null,
        invoiceRef: invoiceRef,
        customerInfo: !auth.currentUser ? guestInfo : null
      };

      // Save order to global 'orders' collection
      await setDoc(doc(db, 'orders', orderId), order);

      // Save to user-specific collections if logged in
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', userId, 'Orders', orderId), order);
        // Optionally update user profile with last order, etc.
      }

      // Build invoice object
      const invoiceId = `INV-${orderId}`;
      const invoice = {
        id: invoiceId,
        orderId: orderId,
        userId: userId,
        customerInfo: !auth.currentUser ? guestInfo : null,
        amount: finalPrice,
        discount: appliedDiscount ? {
          code: appliedDiscount.code,
          amount: appliedDiscount.amount
        } : null,
        paymentId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method,
        status: 'paid',
        createdAt: orderDate,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          selectedSize: item.selectedSize,
          selectedShape: item.selectedShape,
          notes: item.notes || '',
          selectedFinish: item.selectedFinish,
          topper: item.topper,
          topperPrice: item.topperPrice,
          occasion: item.occasion,
          addon: item.addon
        })),
      };

      // Save invoice
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', userId, 'Invoices', invoiceId), invoice);
      } else {
        await setDoc(doc(db, 'invoices', invoiceId), invoice);
      }

      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId,
          total: finalPrice,
          items: cart,
          guestInfo: !auth.currentUser ? guestInfo : null,
          pickupDate,
          pickupTime
        }
      });
    } catch (error) {
      console.error('Error saving order:', error);
      clearCart();
      navigate('/order-confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setIsLoading(false);
  };

  return (
    <div className="checkout-container">
      <PageTitle title="Checkout" />
      <Header />
      <div className="checkout-content">
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="checkout-items">
            {cart.map((item) => (
              <div key={item.id} className="checkout-item">
                <img src={item.image} alt={item.name} className="checkout-item-image" />
                <div className="checkout-item-details">
                  <h3>{item.name}</h3>
                  {item.selectedSize && (
                    <div className="checkout-item-option">Size: {item.selectedSize.size}"</div>
                  )}
                  {item.selectedShape && (
                    <div className="checkout-item-option">Shape: {item.selectedShape.name}</div>
                  )}
                  {item.notes && (
                    <div className="checkout-item-notes">Notes: {item.notes}</div>
                  )}
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="checkout-item-price-column">
                  <p className="checkout-item-price">
                    ${item.price.toFixed(2)} each
                  </p>
                  <p className="checkout-item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="add-more-items">
            <button 
              onClick={() => navigate('/collections')} 
              className="add-more-button"
            >
              Add More Items
            </button>
          </div>
          <div className="checkout-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
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
                      -${appliedDiscount.amount.toFixed(2)}
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
          <div className="payment-section">
            <h2>Payment Information</h2>
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
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={Math.round(totalPrice * 100)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                customerName={guestInfo ? guestInfo.name : auth.currentUser?.displayName}
                customerEmail={guestInfo ? guestInfo.email : auth.currentUser?.email}
              />
            </Elements>
          </div>
        )}
      </div>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Checkout; 
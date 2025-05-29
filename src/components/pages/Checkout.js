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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    // Generate dates for the next month (including next 5 days that will be disabled)
    const dates = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 45);
    let currentDate = new Date(today);
    currentDate.setDate(today.getDate() + 1);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setAvailableDates(dates);
    // Generate available times (9 AM to 7 PM, every 30 min)
    const times = [];
    for (let hour = 9; hour <= 19; hour++) {
      times.push(`${hour}:00`);
      if (hour !== 19) times.push(`${hour}:30`);
    }
    setAvailableTimes(times);
    setLoading(false);
  }, []);

  const isDateDisabled = (date) => {
    const today = new Date();
    const minPickupDate = new Date(today);
    minPickupDate.setDate(today.getDate() + 5); // 5 days notice
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

  const formatDatesByWeekMondayStart = (dates) => {
    const weeks = [];
    let currentWeek = [];
    if (dates.length === 0) return weeks;
    // Get the first date's week start (Monday)
    const firstDate = new Date(dates[0]);
    let dayOfWeek = firstDate.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // convert Sunday=0 to 6, Monday=1 to 0
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
      <h3 style={{ textAlign: 'left', marginBottom: '2rem' }}>Schedule Order</h3>
      <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Calendar and notice */}
        <div>
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', textAlign: 'left', fontFamily: 'serif', fontSize: '1.3rem' }}>Pick-up Date:</label>
          <div className="pickup-notice" style={{ margin: '0 0 1.2rem 0', fontWeight: 400, textAlign: 'left', fontFamily: 'serif', fontSize: '1.1rem', padding: 0 }}>
            All orders require a minimum of 5 days notice before pick-up.
          </div>
          <div className="weekday-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
              <div key={day} className="weekday-name" style={{ textAlign: 'center', fontWeight: 400 }}>{day}</div>
            ))}
          </div>
          <div className="calendar-month">
            {datesByWeek.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                {week.map((date, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`calendar-day${date ? '' : ' empty'}${date && isDateDisabled(date) ? ' disabled' : ''}${date && selectedDate && date.toDateString() === selectedDate.toDateString() ? ' selected' : ''}`}
                    style={{
                      background: date && selectedDate && date.toDateString() === selectedDate.toDateString() ? '#e0e0e0' : '',
                      color: date && selectedDate && date.toDateString() === selectedDate.toDateString() ? '#111' : '',
                      borderRadius: 0,
                      cursor: date && !isDateDisabled(date) ? 'pointer' : 'not-allowed',
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: date && selectedDate && date.toDateString() === selectedDate.toDateString() ? 700 : 400
                    }}
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
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', textAlign: 'left', fontFamily: 'serif', fontSize: '1.3rem' }}>Pick-up Time:</label>
          <div className="clock-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {availableTimes.map((time) => (
              <div
                key={time}
                className={`clock-time${selectedTime === time ? ' selected' : ''}`}
                style={{
                  background: selectedTime === time ? '#e0e0e0' : 'none',
                  color: '#111',
                  border: 'none',
                  borderRadius: 0,
                  padding: '0.7rem 0',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: selectedTime === time ? 700 : 400
                }}
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
              <div key={item.id} className="checkout-item" style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                {/* Image on the left */}
                <div style={{ minWidth: 100, minHeight: 100, background: '#eee', borderRadius: 8, marginRight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                  ) : null}
                </div>
                {/* Details in two columns */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 32 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontWeight: 600 }}>{item.name}</h3>
                    {item.selectedSize && (
                      <div>Size: {item.selectedSize.size}{typeof item.selectedSize.size === 'number' ? '"' : ''}</div>
                    )}
                    {item.selectedShape && (
                      <div>Shape: {item.selectedShape.name}</div>
                    )}
                    {item.selectedFinish && (
                      <div>Finish: {item.selectedFinish.name}</div>
                    )}
                    {item.occasion && (
                      <div>Occasion: {item.occasion}</div>
                    )}
                    {item.topper && (
                      <div>Topper: {item.topper}</div>
                    )}
                    {item.addon && (
                      <div>Add ons: {Array.isArray(item.addon) ? item.addon.join(', ') : item.addon}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    {item.designInspiration && (
                      <div>Design Inspiration: {item.designInspiration}</div>
                    )}
                    {item.notes && (
                      <div>Additional Notes: <span style={{ color: '#444' }}>{item.notes}</span></div>
                    )}
                  </div>
                </div>
                {/* Price and controls on the right */}
                <div style={{ minWidth: 120, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>£{item.price.toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Quantity:</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      style={{ minWidth: 28 }}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      style={{ minWidth: 28 }}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    style={{ marginTop: 8 }}
                  >
                    Remove
                  </button>
                  <Link to={`/change/${item.id}`} style={{ color: '#222', textDecoration: 'underline', marginTop: 8, fontSize: 14 }}>Change</Link>
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
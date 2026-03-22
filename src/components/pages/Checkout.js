import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { doc, setDoc, collection, getDocs, query, where, Timestamp, getDoc } from 'firebase/firestore';
import '../styles/Checkout.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import AuthModal from '../modals/AuthModal';
import {
  buildShopEnquiryEmail,
  buildCustomerEnquiryAckEmail,
  shopEnquirySubject,
} from '../../utils/orderEnquiryEmail';
import { apiUrl } from '../../config/environment';

const ALLERGY_OPTIONS = [
  'Gluten',
  'Nuts',
  'Tree Nuts',
  'Milk',
  'Lupin',
  'Sulphites',
  'Eggs',
  'Soya',
];

const emptyCustomerDetails = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  allergies: [],
  allergyOther: '',
  applyAllergiesToAll: false,
  fruitPreference: '',
  message: '',
});

function getCheckoutItemSpecs(item) {
  const rows = [];
  if (item.selectedSize) {
    rows.push({
      label: 'Size',
      value: `${item.selectedSize.size}${typeof item.selectedSize.size === 'number' ? '"' : ''}`,
    });
  }
  if (item.batchSize) rows.push({ label: 'Batch size', value: item.batchSize });
  if (item.selectedShape?.name) rows.push({ label: 'Shape', value: item.selectedShape.name });
  if (item.decorationStyle) rows.push({ label: 'Decoration', value: item.decorationStyle });
  if (item.selectedFinish?.name) rows.push({ label: 'Finish', value: item.selectedFinish.name });
  if (item.occasion) rows.push({ label: 'Occasion', value: item.occasion });
  if (item.topper) rows.push({ label: 'Topper', value: item.topper });
  const addonList = item.addons ?? item.addon;
  if (addonList) {
    const parts = Array.isArray(addonList)
      ? addonList.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
      : [String(addonList)];
    if (parts.length) rows.push({ label: 'Add-ons', value: parts.join(', ') });
  }
  return rows;
}

const GuestForm = ({ onSubmit, isLoading, submitLabel = 'Continue' }) => (
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
  const [blockedDates, setBlockedDates] = useState([]);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  /** Drives slide-in keyframes when changing month ('next' | 'prev' | null) */
  const [monthSlide, setMonthSlide] = useState(null);

  useEffect(() => {
    const times = [];
    for (let mins = 8 * 60 + 30; mins <= 18 * 60; mins += 30) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      times.push(`${h}:${m === 0 ? '00' : '30'}`);
    }
    setAvailableTimes(times);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const blockedDatesRef = collection(db, 'blockedDates');
        const snapshot = await getDocs(blockedDatesRef);
        const dates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBlockedDates(dates);
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };

    fetchBlockedDates();
  }, []);

  useEffect(() => {
    if (!monthSlide) return undefined;
    const id = setTimeout(() => setMonthSlide(null), 420);
    return () => clearTimeout(id);
  }, [displayedMonth, monthSlide]);

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
    minPickupDate.setDate(today.getDate() + 14);
    
    // Check if date is before minimum pickup date
    if (date < minPickupDate) return true;
    
    // Check if date is blocked
    return blockedDates.some(blocked => 
      new Date(blocked.date).toDateString() === date.toDateString()
    );
  };

  const isTimeBlocked = (time) => {
    if (!selectedDate) return false;
    const blockedDate = blockedDates.find(blocked => 
      new Date(blocked.date).toDateString() === selectedDate.toDateString()
    );
    return blockedDate?.blockedTimes?.includes(time) || false;
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setPickupDate(date.toISOString());
      setSelectedTime(null);
      setPickupTime('');
    }
  };

  const handleTimeSelect = (time) => {
    if (!isTimeBlocked(time)) {
    setSelectedTime(time);
    setPickupTime(time);
    }
  };

  const goToPrevMonth = () => {
    setMonthSlide('prev');
    setDisplayedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setMonthSlide('next');
    setDisplayedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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

  const datesByWeek = useMemo(
    () => formatDatesByWeekMondayStart(availableDates),
    [availableDates]
  );

  /** Single flat row-major list so the grid matches the time-slot glider math */
  const flatCalendarCells = useMemo(() => {
    const cells = [];
    datesByWeek.forEach((week) => {
      week.forEach((d) => cells.push(d));
    });
    return cells;
  }, [datesByWeek]);

  const calSelIndex = useMemo(() => {
    if (!selectedDate) return -1;
    return flatCalendarCells.findIndex(
      (d) => d && d.toDateString() === selectedDate.toDateString()
    );
  }, [selectedDate, flatCalendarCells]);

  const calCol = calSelIndex >= 0 ? calSelIndex % 7 : 0;
  const calRow = calSelIndex >= 0 ? Math.floor(calSelIndex / 7) : 0;

  const timeIndex = useMemo(
    () => (selectedTime ? availableTimes.indexOf(selectedTime) : -1),
    [selectedTime, availableTimes]
  );
  const timeCol = timeIndex >= 0 ? timeIndex % 4 : 0;
  const timeRow = timeIndex >= 0 ? Math.floor(timeIndex / 4) : 0;

  const monthKey = `${displayedMonth.getFullYear()}-${displayedMonth.getMonth()}`;
  const calendarSlideClass =
    monthSlide === 'next'
      ? 'calendar-body-slide--next'
      : monthSlide === 'prev'
        ? 'calendar-body-slide--prev'
        : '';

  if (loading) {
    return <div className="loading">Loading pickup options...</div>;
  }

  return (
    <div className="pickup-schedule pickup-schedule--narrow">
      <h3 className="pickup-schedule-title pickup-schedule-title--center">Schedule Order</h3>
      <div className="schedule-grid schedule-grid--panels">
        <div className="schedule-panel schedule-panel--calendar">
          <label className="schedule-panel-label" htmlFor="checkout-calendar-anchor">Pick-up Date</label>
          <p id="checkout-calendar-anchor" className="schedule-panel-hint">
            All cake orders require at least 14 days notice for picking.
          </p>
          <div className="calendar-month-nav">
            <button type="button" onClick={goToPrevMonth} aria-label="Previous month">&lsaquo;</button>
            <span className="calendar-month-name">{monthName}</span>
            <button type="button" onClick={goToNextMonth} aria-label="Next month">&rsaquo;</button>
          </div>
          <div
            key={monthKey}
            className={`calendar-body-slide ${calendarSlideClass}`.trim()}
          >
            <div className="weekday-header">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="weekday-name">
                  {day}
                </div>
              ))}
            </div>
            <div
              className="calendar-month calendar-month--flat"
              style={
                calSelIndex >= 0
                  ? { '--cal-sel-col': calCol, '--cal-sel-row': calRow }
                  : undefined
              }
            >
              {calSelIndex >= 0 ? <div className="calendar-selection-glider" aria-hidden="true" /> : null}
              {flatCalendarCells.map((date, idx) => (
                <button
                  key={date ? `d-${date.getTime()}` : `e-${idx}`}
                  type="button"
                  disabled={!date || isDateDisabled(date)}
                  className={`calendar-day${date ? '' : ' empty'}${date && isDateDisabled(date) ? ' disabled' : ''}${date && selectedDate && date.toDateString() === selectedDate.toDateString() ? ' selected' : ''}`}
                  onClick={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="schedule-panel schedule-panel--time">
          <label className="schedule-panel-label">Pick-up Time</label>
          <p className="schedule-panel-hint schedule-panel-hint--time">
            All orders will be ready the day before they are due. If you require a later pick-up time, please send an email to{' '}
            <a href="mailto:Enquiries@bakesbyolayide.co.uk">Enquiries@bakesbyolayide.co.uk</a>.
          </p>
          <div className="schedule-panel-time-slots">
            <div
              className="clock-grid clock-grid--four clock-grid--with-glider"
              style={
                timeIndex >= 0
                  ? { '--time-sel-col': timeCol, '--time-sel-row': timeRow }
                  : undefined
              }
            >
              {timeIndex >= 0 ? <div className="clock-time-glider" aria-hidden="true" /> : null}
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  disabled={isTimeBlocked(time)}
                  className={`clock-time${selectedTime === time ? ' selected' : ''}${isTimeBlocked(time) ? ' disabled' : ''}`}
                  onClick={() => !isTimeBlocked(time) && handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cart, totalPrice, clearCart, updateQuantity, setCart } = useCart();
  const navigate = useNavigate();
  const [guestInfo, setGuestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  /** 'saving' = writing to Firestore; 'ready' = saved, about to redirect (emails run in background) */
  const [submitPhase, setSubmitPhase] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [tempCart, setTempCart] = useState(null);
  const [user, setUser] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(() => emptyCustomerDetails());
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    (async () => {
      let firstName = '';
      let lastName = '';
      let phone = '';
      const dn = user.displayName?.trim();
      if (dn) {
        const bits = dn.split(/\s+/);
        firstName = bits[0] || '';
        lastName = bits.slice(1).join(' ') || '';
      }
      try {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.displayName?.trim()) {
            const bits = data.displayName.trim().split(/\s+/);
            firstName = bits[0] || firstName;
            lastName = bits.slice(1).join(' ') || lastName;
          }
          if (data.phoneNumber) phone = String(data.phoneNumber);
        }
      } catch (e) {
        /* ignore */
      }
      if (!cancelled) {
        setCustomerDetails((prev) => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: user.email || prev.email,
          phone: phone || prev.phone,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email, user?.displayName]);

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
        <h2>Your basket is empty</h2>
        <p>Add some items from the shop before sending an order enquiry.</p>
        <button onClick={() => navigate('/collections')} className="return-to-shop">
          Return to Shop
        </button>
      </div>
    );
  }

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nameRaw = (formData.get('name') || '').toString().trim();
    const bits = nameRaw.split(/\s+/).filter(Boolean);
    const firstName = bits[0] || '';
    const lastName = bits.slice(1).join(' ') || '';
    const email = (formData.get('email') || '').toString();
    const phone = (formData.get('phone') || '').toString();
    setGuestInfo({ name: nameRaw, email, phone });
    setCustomerDetails((prev) => ({
      ...prev,
      firstName,
      lastName,
      email,
      phone,
    }));
  };

  const buildCustomerPayload = () => {
    const firstName = customerDetails.firstName.trim();
    const lastName = customerDetails.lastName.trim();
    const name = [firstName, lastName].filter(Boolean).join(' ') || customerDetails.email.trim();
    return {
      name,
      firstName,
      lastName,
      email: customerDetails.email.trim(),
      phone: customerDetails.phone.trim(),
      allergies: [...customerDetails.allergies],
      allergyOther: customerDetails.allergyOther.trim(),
      applyAllergiesToAllItems: customerDetails.applyAllergiesToAll,
      fruitPreference: customerDetails.fruitPreference.trim(),
    };
  };

  const toggleAllergy = (key) => {
    if (key === 'None') {
      setCustomerDetails((prev) => ({ ...prev, allergies: ['None'], allergyOther: '' }));
      return;
    }
    if (key === 'Other') {
      setCustomerDetails((prev) => {
        const withoutNone = (prev.allergies || []).filter((a) => a !== 'None');
        const has = withoutNone.includes('Other');
        const allergies = has ? withoutNone.filter((a) => a !== 'Other') : [...withoutNone, 'Other'];
        return { ...prev, allergies };
      });
      return;
    }
    setCustomerDetails((prev) => {
      let next = (prev.allergies || []).filter((a) => a !== 'None');
      if (next.includes(key)) next = next.filter((a) => a !== key);
      else next = [...next, key];
      return { ...prev, allergies: next };
    });
  };

  const handleSubmitEnquiry = async () => {
    setSubmitError('');
    if (!pickupDate || !pickupTime) {
      setSubmitError('Please choose a pick-up date and time before submitting your order request.');
      return;
    }

    try {
      setIsLoading(true);

      const randomString = Math.random().toString(36).substring(2, 10);
      const orderId = `ORD-${Date.now()}-${randomString}`;

      const userId = user ? user.uid : null;
      const userEmail = user ? user.email : null;

      let formattedPickupDate = pickupDate;
      if (pickupDate) {
        try {
          const dateObj = new Date(pickupDate);
          formattedPickupDate = dateObj.toISOString().slice(0, 10);
        } catch (e) {
          /* keep as-is */
        }
      }

      const customerInfo = buildCustomerPayload();
      if (
        !customerInfo.firstName ||
        !customerInfo.lastName ||
        !customerInfo.email ||
        !customerInfo.phone
      ) {
        setSubmitError(
          'Please complete your details below: first name, last name, email, and phone number are required.'
        );
        setIsLoading(false);
        return;
      }

      const enquiryNotes = customerDetails.message.trim() || null;
      const discountAmount = calculateDiscountAmount();
      const emailPayload = {
        orderId,
        items: cart,
        subtotal: totalPrice,
        total: finalPrice,
        appliedDiscount: appliedDiscount
          ? {
              code: appliedDiscount.code,
              description: appliedDiscount.description,
              amount: appliedDiscount.amount,
              percentage: appliedDiscount.percentage,
            }
          : null,
        guestInfo: customerInfo,
        pickupDate: formattedPickupDate,
        pickupTime,
        enquiryNotes,
      };

      const invoiceId = orderId;
      const invoiceRefPath = `invoices/${invoiceId}`;

      const orderData = {
        orderId,
        items: cart,
        subtotal: totalPrice,
        total: finalPrice,
        discountAmount,
        appliedDiscount: emailPayload.appliedDiscount,
        guestInfo: customerInfo,
        pickupDate: formattedPickupDate,
        pickupTime,
        enquiryNotes,
        paymentMethod: 'in_person',
        createdAt: Timestamp.now(),
        status: 'pending',
        invoiceRef: invoiceRefPath,
        enquiryEmailStatus: 'pending',
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
      };

      const invoiceData = {
        invoiceId,
        orderId,
        items: cart.map(item => ({ ...item, total: item.price * item.quantity })),
        amount: finalPrice,
        status: 'unpaid',
        paymentMethod: 'in_person',
        createdAt: Timestamp.now(),
        customerEmail: customerInfo?.email || '',
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
      };

      setSubmitPhase('saving');

      const persistTasks = [
        setDoc(doc(db, 'orders', orderId), orderData),
        setDoc(doc(db, 'invoices', invoiceId), invoiceData),
      ];
      if (user) {
        persistTasks.push(
          setDoc(doc(db, 'users', user.uid, 'Orders', orderId), orderData).catch((err) => {
            console.error('Error writing order to user subcollection:', err);
          })
        );
      }
      await Promise.all(persistTasks);

      const shopHtml = buildShopEnquiryEmail(emailPayload);
      const customerHtml = buildCustomerEnquiryAckEmail(emailPayload);
      const mailBody = JSON.stringify({
        shopSubject: shopEnquirySubject(emailPayload),
        shopHtml,
        customerEmail: customerInfo?.email || '',
        customerSubject: `We received your order request — ${orderId}`,
        customerHtml,
        clientSource: 'checkout',
      });

      setSubmitPhase('ready');

      const cartSnapshot = cart.map((i) => ({ ...i }));
      clearCart();
      setCustomerDetails(emptyCustomerDetails());

      void fetch(apiUrl('/api/send-order-enquiry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mailBody,
        keepalive: true,
      })
        .then(async (mailRes) => {
          if (!mailRes.ok) {
            const errText = await mailRes.text();
            console.error('Order enquiry email failed:', errText);
            try {
              await setDoc(
                doc(db, 'orders', orderId),
                { enquiryEmailStatus: 'failed', enquiryEmailFailedAt: Timestamp.now() },
                { merge: true }
              );
            } catch (e) {
              console.error('Could not record email failure on order:', e);
            }
            return;
          }
          try {
            await setDoc(
              doc(db, 'orders', orderId),
              { enquiryEmailStatus: 'sent', enquiryEmailSentAt: Timestamp.now() },
              { merge: true }
            );
          } catch (e) {
            console.error('Could not record email success on order:', e);
          }
        })
        .catch((err) => {
          console.error('Order enquiry email request failed:', err);
          setDoc(
            doc(db, 'orders', orderId),
            { enquiryEmailStatus: 'failed', enquiryEmailFailedAt: Timestamp.now() },
            { merge: true }
          ).catch(() => {});
        });

      await new Promise((r) => setTimeout(r, 400));

      navigate('/order-confirmation', {
        state: {
          orderId,
          items: cartSnapshot,
          total: finalPrice,
          guestInfo: customerInfo,
          pickupDate: formattedPickupDate,
          pickupTime,
          emailInBackground: true,
        },
      });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setSubmitPhase(null);
    }
  };

  return (
    <div className="checkout-container">
      <PageTitle title="Basket" />
      <Header user={user} />
      <div className="checkout-content">
        <div className="order-summary">
          <h2 className="order-summary-heading">Order Summary</h2>
          <div className="checkout-items">
            {cart.map((item) => {
              const specs = getCheckoutItemSpecs(item);
              return (
                <div key={item.id} className="checkout-item checkout-item--figma">
                  <div
                    className={`checkout-item-thumb${item.image ? '' : ' checkout-item-thumb--placeholder'}`}
                  >
                    {item.image ? <img src={item.image} alt="" /> : null}
                  </div>
                  <div className="checkout-item-body">
                    <h3 className="checkout-item-title">{item.name}</h3>
                    {specs.length > 0 ? (
                      <div className="checkout-spec-grid">
                        {specs.map((row) => (
                          <div key={row.label} className="checkout-spec-pair">
                            <span className="checkout-spec-k">{row.label}</span>
                            <span className="checkout-spec-v">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="checkout-item-inspiration">
                    {item.designInspiration ? (
                      <div className="checkout-inspiration-block">
                        <span className="checkout-inspiration-heading">Design inspiration</span>
                        <p className="checkout-inspiration-text">{item.designInspiration}</p>
                      </div>
                    ) : null}
                    {item.notes ? (
                      <div className="checkout-inspiration-block">
                        <span className="checkout-inspiration-heading">Additional notes</span>
                        <p className="checkout-inspiration-text">{item.notes}</p>
                      </div>
                    ) : null}
                    {!item.designInspiration && !item.notes ? (
                      <span className="checkout-inspiration-empty">—</span>
                    ) : null}
                  </div>
                  <div className="checkout-item-aside">
                    <div className="checkout-item-price-tag">£{item.price.toFixed(2)}</div>
                    <Link to={`/change/${item.id}`} className="checkout-change-link checkout-change-link--accent">
                      Change
                    </Link>
                    <div className="checkout-item-quantity-controls">
                      <span className="checkout-quantity-label">Quantity</span>
                      <div className="checkout-qty-stepper">
                        <button
                          type="button"
                          className="checkout-quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="checkout-quantity">{item.quantity}</span>
                        <button
                          type="button"
                          className="checkout-quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <span>Total (pay in person)</span>
              <span>£{finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!user && !guestInfo ? (
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
                <GuestForm onSubmit={handleGuestSubmit} isLoading={isLoading} submitLabel="Continue" />
              </div>
            </div>
          </div>
        ) : (
          <div className="checkout-after-auth">
            {guestInfo ? (
              <div className="guest-info-summary guest-info-summary--compact">
                <span>
                  Continuing as <strong>{guestInfo.name}</strong> ({guestInfo.email})
                </span>
                <button type="button" onClick={() => setGuestInfo(null)} className="edit-info-button">
                  Switch account
                </button>
              </div>
            ) : null}
            <PickupSchedule
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
            />
            <p className="checkout-payment-notice">
              No online payment — we will contact you by email or phone to confirm your order and arrange payment in
              person (card or cash as agreed).
            </p>

            <div className="checkout-customer-narrow">
            <section className="checkout-customer-section" aria-labelledby="checkout-customer-heading">
              <h2 id="checkout-customer-heading" className="checkout-customer-title">
                Customer Details
              </h2>
              <div className="checkout-customer-names">
                <div className="checkout-customer-field">
                  <label htmlFor="cd-first">First name*</label>
                  <input
                    id="cd-first"
                    type="text"
                    autoComplete="given-name"
                    className="checkout-customer-input"
                    placeholder="Jane"
                    value={customerDetails.firstName}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="checkout-customer-field">
                  <label htmlFor="cd-last">Last name*</label>
                  <input
                    id="cd-last"
                    type="text"
                    autoComplete="family-name"
                    className="checkout-customer-input"
                    placeholder="Smith"
                    value={customerDetails.lastName}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="checkout-customer-names">
                <div className="checkout-customer-field">
                  <label htmlFor="cd-email">Email address*</label>
                  <input
                    id="cd-email"
                    type="email"
                    autoComplete="email"
                    className="checkout-customer-input"
                    placeholder="email@example.co.uk"
                    value={customerDetails.email}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div className="checkout-customer-field">
                  <label htmlFor="cd-phone">Phone number*</label>
                  <div className="checkout-phone-row">
                    <span className="checkout-phone-prefix" aria-hidden="true">
                      🇬🇧 +44
                    </span>
                    <input
                      id="cd-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      className="checkout-customer-input checkout-customer-input--phone"
                      placeholder="7000 012345"
                      value={customerDetails.phone}
                      onChange={(e) =>
                        setCustomerDetails((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="checkout-allergy-heading">
                <p className="checkout-allergy-section-label">Allergens or Dietary Preferences*</p>
                <p className="checkout-allergy-item-label">Item 1:</p>
              </div>
              <div className="checkout-allergy-grid">
                {ALLERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`checkout-allergy-chip${
                      customerDetails.allergies.includes(opt) ? ' is-selected' : ''
                    }`}
                    onClick={() => toggleAllergy(opt)}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  type="button"
                  className={`checkout-allergy-chip checkout-allergy-chip--wide${
                    customerDetails.allergies.includes('None') ? ' is-selected' : ''
                  }`}
                  onClick={() => toggleAllergy('None')}
                >
                  None
                </button>
                <button
                  type="button"
                  className={`checkout-allergy-chip checkout-allergy-chip--wide${
                    customerDetails.allergies.includes('Other') ? ' is-selected' : ''
                  }`}
                  onClick={() => toggleAllergy('Other')}
                >
                  Other
                </button>
              </div>
              {customerDetails.allergies.includes('Other') ? (
                <div className="checkout-customer-field checkout-customer-field--full">
                  <label htmlFor="cd-allergy-other">Other (please specify)</label>
                  <input
                    id="cd-allergy-other"
                    type="text"
                    className="checkout-customer-input"
                    placeholder="Please specify"
                    value={customerDetails.allergyOther}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({ ...p, allergyOther: e.target.value }))
                    }
                  />
                </div>
              ) : null}

              <div className="checkout-fruit-row">
                <div className="checkout-customer-field checkout-customer-field--grow">
                  <label htmlFor="cd-fruit">Fruit preference (optional)</label>
                  <input
                    id="cd-fruit"
                    type="text"
                    className="checkout-customer-input"
                    placeholder="Other"
                    value={customerDetails.fruitPreference}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({ ...p, fruitPreference: e.target.value }))
                    }
                  />
                </div>
                <label className="checkout-apply-all">
                  <input
                    type="checkbox"
                    checked={customerDetails.applyAllergiesToAll}
                    onChange={(e) =>
                      setCustomerDetails((p) => ({
                        ...p,
                        applyAllergiesToAll: e.target.checked,
                      }))
                    }
                  />
                  <span>Apply to all items</span>
                </label>
              </div>

              <div className="checkout-customer-field checkout-customer-field--full">
                <label htmlFor="cd-message">Additional Notes</label>
                <textarea
                  id="cd-message"
                  className="checkout-customer-textarea"
                  rows={5}
                  placeholder="Enter your message"
                  maxLength={2000}
                  value={customerDetails.message}
                  onChange={(e) =>
                    setCustomerDetails((p) => ({ ...p, message: e.target.value }))
                  }
                />
              </div>
            </section>

            {submitError ? (
              <div className="checkout-submit-error" role="alert">
                {submitError}
              </div>
            ) : null}
            <button
              type="button"
              className="checkout-enquire-btn"
              onClick={handleSubmitEnquiry}
              disabled={isLoading}
            >
              {isLoading
                ? submitPhase === 'ready'
                  ? 'Finishing up…'
                  : 'Saving your order…'
                : 'Enquire with Us'}
            </button>
            </div>
          </div>
        )}
      </div>
      {submitPhase && (
        <div className="checkout-submit-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="checkout-submit-progress-card">
            <div className="checkout-submit-spinner-wrap" aria-hidden>
              {submitPhase === 'ready' ? (
                <span className="checkout-submit-check">✓</span>
              ) : (
                <div className="checkout-submit-spinner" />
              )}
            </div>
            <h2 id="checkout-submit-progress-title" className="checkout-submit-progress-title">
              {submitPhase === 'ready' ? 'Order saved' : 'Placing your order'}
            </h2>
            <ol className="checkout-submit-steps">
              <li className={submitPhase === 'saving' ? 'is-active' : 'is-done'}>
                <span className="checkout-submit-step-marker" aria-hidden />
                <span>Saving your order and invoice</span>
              </li>
              <li className={submitPhase === 'ready' ? 'is-active' : ''}>
                <span className="checkout-submit-step-marker" aria-hidden />
                <span>
                  Sending confirmation emails
                  <span className="checkout-submit-step-note"> (runs in the background — you won’t wait on the mail server)</span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Checkout; 
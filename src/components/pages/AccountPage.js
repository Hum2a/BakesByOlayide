import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaUser,
  FaShoppingBag,
  FaHome,
  FaQuestionCircle,
  FaSignOutAlt,
  FaCog,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLink,
  FaEdit,
  FaStar,
  FaChevronRight,
  FaBookOpen,
  FaLeaf,
  FaBalanceScale,
} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import AuthModal from '../modals/AuthModal';
import SettingsModal from '../modals/SettingsModal';
import ReviewModal from '../modals/ReviewModal';
import '../styles/AccountPage.css';
import {
  formatOrderTimestamp,
  getCustomerOrderStatusPresentation,
  canWriteReviewForOrder,
} from '../../utils/customerOrderUi';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FaHome },
  { id: 'profile', label: 'Profile & contact', icon: FaUser },
  { id: 'orders', label: 'Orders & enquiries', icon: FaShoppingBag },
  { id: 'help', label: 'Help & guides', icon: FaQuestionCircle },
];

const AccountPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';

  const setActiveTab = (id) => {
    setSearchParams(id === 'overview' ? {} : { tab: id });
  };

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phoneNumber: '',
    bio: '',
    location: '',
    website: '',
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reviewedItems, setReviewedItems] = useState(new Set());
  const [reviewItem, setReviewItem] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const data = snap.exists() ? snap.data() : {};
      setProfileForm({
        displayName: data.displayName || auth.currentUser.displayName || '',
        phoneNumber: data.phoneNumber || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
      });
    } catch (e) {
      console.error(e);
      setProfileError('Could not load your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user, loadProfile]);

  const fetchReviewedItems = useCallback(async (ordersList) => {
    if (!auth.currentUser || !ordersList?.length) {
      setReviewedItems(new Set());
      return;
    }
    try {
      const reviewedSet = new Set();
      for (const order of ordersList) {
        for (const item of order.items || []) {
          if (!item.id) continue;
          const reviewsQuery = query(
            collection(db, 'cakes', item.id, 'reviews'),
            where('userId', '==', auth.currentUser.uid),
            where('orderId', '==', order.id)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          if (!reviewsSnapshot.empty) {
            reviewedSet.add(`${order.id}-${item.id}`);
          }
        }
      }
      setReviewedItems(reviewedSet);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!auth.currentUser) return;
    setOrdersLoading(true);
    try {
      const ref = collection(db, 'users', auth.currentUser.uid, 'Orders');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setOrders(list);
      await fetchReviewedItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  }, [fetchReviewedItems]);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [user, loadOrders]);

  useEffect(() => {
    setProfileMessage(null);
  }, [activeTab]);

  const memberSince = useMemo(() => {
    if (!user?.metadata?.creationTime) return null;
    try {
      return new Date(user.metadata.creationTime).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [user]);

  const pendingCount = useMemo(
    () =>
      orders.filter((o) =>
        ['pending', 'unpaid', 'incomplete'].includes((o.status || '').toLowerCase())
      ).length,
    [orders]
  );

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: profileForm.displayName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        bio: profileForm.bio.trim(),
        location: profileForm.location.trim(),
        website: profileForm.website.trim(),
      });
      setProfileEditing(false);
      setProfileMessage('Profile updated.');
    } catch (err) {
      console.error(err);
      setProfileError('Could not save changes. Try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/home');
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className="account-page">
        <PageTitle title="Account" />
        <Header />
        <div className="account-loading">Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-page">
        <PageTitle title="Account" />
        <Header />
        <main className="account-main account-main--guest">
          <div className="account-guest-card">
            <h1>Account</h1>
            <p className="account-guest-lead">
              Sign in to manage your profile, track order enquiries, and speed up checkout with saved
              contact details.
            </p>
            <button type="button" className="account-btn account-btn--primary" onClick={() => setAuthModalOpen(true)}>
              Sign in or create an account
            </button>
            <p className="account-guest-hint">
              Orders are confirmed by our team by email or phone — an account keeps everything in one place.
            </p>
            <Link to="/collections" className="account-text-link">
              Continue browsing <FaChevronRight className="account-inline-icon" />
            </Link>
          </div>
        </main>
        <Footer />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="account-page">
      <PageTitle title="Account" />
      <Header />
      <main className="account-main">
        <header className="account-page-header">
          <h1>Account</h1>
          <p className="account-page-subtitle">
            Your details, enquiries, and shortcuts — all in one place.
          </p>
        </header>

        <div className="account-layout">
          <aside className="account-sidebar" aria-label="Account sections">
            <nav className="account-tab-list">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`account-tab ${activeTab === id ? 'account-tab--active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon aria-hidden />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="account-sidebar-actions">
              <button type="button" className="account-sidebar-link" onClick={() => setSettingsOpen(true)}>
                <FaCog aria-hidden /> Settings &amp; security
              </button>
              <button type="button" className="account-sidebar-link account-sidebar-link--muted" onClick={handleSignOut}>
                <FaSignOutAlt aria-hidden /> Sign out
              </button>
            </div>
          </aside>

          <div className="account-panel">
            {profileMessage && (
              <div className="account-banner account-banner--success" role="status">
                {profileMessage}
              </div>
            )}

            {activeTab === 'overview' && (
              <section className="account-section" aria-labelledby="account-overview-heading">
                <h2 id="account-overview-heading" className="account-section-title">
                  Overview
                </h2>
                <div className="account-hero-card">
                  <div className="account-avatar" aria-hidden>
                    {(profileForm.displayName || user.displayName || user.email || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="account-welcome">Welcome back</p>
                    <h3 className="account-name">{profileForm.displayName || user.displayName || 'Baker friend'}</h3>
                    <p className="account-email">{user.email}</p>
                    {memberSince && <p className="account-meta">Member since {memberSince}</p>}
                  </div>
                </div>

                <div className="account-stat-grid">
                  <div className="account-stat-card">
                    <span className="account-stat-value">{orders.length}</span>
                    <span className="account-stat-label">Total enquiries</span>
                  </div>
                  <div className="account-stat-card account-stat-card--accent">
                    <span className="account-stat-value">{pendingCount}</span>
                    <span className="account-stat-label">Awaiting approval</span>
                  </div>
                  <div className="account-stat-card">
                    <span className="account-stat-value">
                      {profileForm.phoneNumber ? '✓' : '—'}
                    </span>
                    <span className="account-stat-label">Phone on file</span>
                  </div>
                </div>

                <div className="account-quick-links">
                  <Link to="/collections" className="account-quick-card">
                    <span className="account-quick-title">Shop our range</span>
                    <span className="account-quick-desc">Cupcakes, celebration cakes, and more</span>
                  </Link>
                  <Link to="/basket" className="account-quick-card">
                    <span className="account-quick-title">Your basket</span>
                    <span className="account-quick-desc">Review items and submit an order enquiry</span>
                  </Link>
                  <Link to="/contact" className="account-quick-card">
                    <span className="account-quick-title">Contact us</span>
                    <span className="account-quick-desc">Questions before you order</span>
                  </Link>
                </div>

                <h3 className="account-subheading">Recent activity</h3>
                {ordersLoading ? (
                  <p className="account-muted">Loading orders…</p>
                ) : orders.length === 0 ? (
                  <p className="account-muted">No orders yet. When you submit a basket enquiry, it will show here.</p>
                ) : (
                  <ul className="account-recent-list">
                    {orders.slice(0, 3).map((order) => {
                      const st = getCustomerOrderStatusPresentation(order.status);
                      const fd = formatOrderTimestamp(order.createdAt);
                      return (
                        <li key={order.id} className="account-recent-row">
                          <div>
                            <span className="account-recent-id">#{order.id.slice(-8)}</span>
                            <span className="account-recent-date">
                              {fd.date} {fd.time}
                            </span>
                          </div>
                          <span className={`account-order-status-pill ${st.className}`}>
                            {st.icon}
                            {st.label}
                          </span>
                          <button type="button" className="account-link-btn" onClick={() => setActiveTab('orders')}>
                            View
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {activeTab === 'profile' && (
              <section className="account-section" aria-labelledby="account-profile-heading">
                <h2 id="account-profile-heading" className="account-section-title">
                  Profile &amp; contact
                </h2>
                <p className="account-section-intro">
                  We use these details to confirm your orders and reach you about pickup and payment. Keep your phone
                  number up to date.
                </p>
                {profileError && (
                  <div className="account-banner account-banner--error" role="alert">
                    {profileError}
                  </div>
                )}
                {profileLoading ? (
                  <p className="account-muted">Loading profile…</p>
                ) : profileEditing ? (
                  <form className="account-form" onSubmit={handleProfileSave}>
                    <div className="account-form-grid">
                      <label className="account-field">
                        <span className="account-field-label">Display name</span>
                        <input
                          name="displayName"
                          value={profileForm.displayName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                          required
                          autoComplete="name"
                        />
                      </label>
                      <label className="account-field">
                        <span className="account-field-label">Phone</span>
                        <input
                          name="phoneNumber"
                          type="tel"
                          value={profileForm.phoneNumber}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                          autoComplete="tel"
                          placeholder="For order updates"
                        />
                      </label>
                    </div>
                    <label className="account-field account-field--full">
                      <span className="account-field-label">Email</span>
                      <input type="email" value={user.email || ''} disabled className="account-input-disabled" />
                      <span className="account-field-hint">Email is tied to your sign-in. Change it in Settings if needed.</span>
                    </label>
                    <label className="account-field account-field--full">
                      <span className="account-field-label">Bio (optional)</span>
                      <textarea
                        name="bio"
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell us a little about you or favourite flavours"
                      />
                    </label>
                    <div className="account-form-grid">
                      <label className="account-field">
                        <span className="account-field-label">Town / area (optional)</span>
                        <input
                          name="location"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))}
                          placeholder="e.g. Cornwall"
                        />
                      </label>
                      <label className="account-field">
                        <span className="account-field-label">Website (optional)</span>
                        <input
                          name="website"
                          type="url"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
                          placeholder="https://"
                        />
                      </label>
                    </div>
                    <div className="account-form-actions">
                      <button type="button" className="account-btn account-btn--ghost" onClick={() => {
                        setProfileEditing(false);
                        setProfileError(null);
                        loadProfile();
                      }}>
                        Cancel
                      </button>
                      <button type="submit" className="account-btn account-btn--primary">
                        Save changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="account-profile-read">
                    <dl className="account-dl">
                      <div className="account-dl-row">
                        <dt><FaUser aria-hidden /> Name</dt>
                        <dd>{profileForm.displayName || '—'}</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt><FaEnvelope aria-hidden /> Email</dt>
                        <dd>{user.email}</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt><FaPhone aria-hidden /> Phone</dt>
                        <dd>{profileForm.phoneNumber || 'Not set — add for faster checkout'}</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt><FaMapMarkerAlt aria-hidden /> Area</dt>
                        <dd>{profileForm.location || '—'}</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt><FaLink aria-hidden /> Website</dt>
                        <dd>{profileForm.website ? <a href={profileForm.website}>{profileForm.website}</a> : '—'}</dd>
                      </div>
                      <div className="account-dl-row account-dl-row--block">
                        <dt>Bio</dt>
                        <dd>{profileForm.bio || '—'}</dd>
                      </div>
                    </dl>
                    <button type="button" className="account-btn account-btn--secondary" onClick={() => setProfileEditing(true)}>
                      <FaEdit aria-hidden /> Edit profile
                    </button>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="account-section" aria-labelledby="account-orders-heading">
                <h2 id="account-orders-heading" className="account-section-title">
                  Orders &amp; enquiries
                </h2>
                <p className="account-section-intro">
                  After you submit your basket, each enquiry appears here while we confirm details and arrange payment in
                  person. You’ll get email updates — reply or call us anytime with your order reference.
                </p>
                {ordersLoading ? (
                  <p className="account-muted">Loading your orders…</p>
                ) : orders.length === 0 ? (
                  <div className="account-empty-state">
                    <FaShoppingBag className="account-empty-icon" aria-hidden />
                    <h3>No enquiries yet</h3>
                    <p>Build a basket and submit an order request — it will show up here with live status.</p>
                    <Link to="/basket" className="account-btn account-btn--primary">
                      Go to basket
                    </Link>
                  </div>
                ) : (
                  <div className="account-orders-list">
                    {orders.map((order) => {
                      const st = getCustomerOrderStatusPresentation(order.status);
                      const fd = formatOrderTimestamp(order.createdAt);
                      let pickupDateLabel = '';
                      if (order.pickupDate) {
                        const pd = new Date(order.pickupDate);
                        pickupDateLabel = Number.isNaN(pd.getTime())
                          ? String(order.pickupDate)
                          : pd.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            });
                      }
                      const showReview = canWriteReviewForOrder(order.status);
                      return (
                        <article key={order.id} className="account-order-card">
                          <div className="account-order-card-top">
                            <div>
                              <span className="account-order-ref">Order #{order.id.slice(-8)}</span>
                              <div className="account-order-meta">
                                <FaCalendarAlt aria-hidden />
                                <span>
                                  {fd.date} · {fd.time}
                                </span>
                              </div>
                            </div>
                            <span className={`account-order-status-pill ${st.className}`}>
                              {st.icon}
                              {st.label}
                            </span>
                          </div>
                          {order.paymentMethod === 'in_person' && (
                            <p className="account-order-note">Payment in person when your order is confirmed.</p>
                          )}
                          {(order.pickupDate || order.pickupTime) && (
                            <p className="account-order-pickup">
                              <strong>Requested pickup:</strong>{' '}
                              {pickupDateLabel || '—'}
                              {order.pickupTime ? ` · ${order.pickupTime}` : ''}
                            </p>
                          )}
                          {order.enquiryNotes && (
                            <p className="account-order-notes">
                              <strong>Your note:</strong> {order.enquiryNotes}
                            </p>
                          )}
                          <ul className="account-order-items">
                            {(order.items || []).map((item, idx) => {
                              const reviewed = reviewedItems.has(`${order.id}-${item.id}`);
                              return (
                                <li key={`${order.id}-${idx}`} className="account-order-line">
                                  {item.image && (
                                    <img src={item.image} alt="" className="account-order-thumb" />
                                  )}
                                  <div className="account-order-line-body">
                                    <span className="account-order-line-name">{item.name}</span>
                                    <span className="account-order-line-meta">
                                      Qty {item.quantity} · £{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                    </span>
                                    {showReview && item.id && (
                                      <button
                                        type="button"
                                        className={`account-review-chip ${reviewed ? 'account-review-chip--done' : ''}`}
                                        disabled={reviewed}
                                        onClick={() => !reviewed && setReviewItem({ ...item, orderId: order.id })}
                                      >
                                        <FaStar aria-hidden />
                                        {reviewed ? 'Reviewed' : 'Write a review'}
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="account-order-footer">
                            <span className="account-order-total">
                              Total <strong>£{Number(order.total ?? 0).toFixed(2)}</strong>
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'help' && (
              <section className="account-section" aria-labelledby="account-help-heading">
                <h2 id="account-help-heading" className="account-section-title">
                  Help &amp; guides
                </h2>
                <p className="account-section-intro">
                  Everything you need to choose the right bake, understand allergens, and get in touch.
                </p>
                <div className="account-help-grid">
                  <Link to="/guides" className="account-help-card">
                    <FaBookOpen className="account-help-icon" aria-hidden />
                    <span className="account-help-title">Baking guides</span>
                    <span className="account-help-desc">Sizing, occasions, and pricing tips</span>
                  </Link>
                  <Link to="/guides/dietary-requirements" className="account-help-card">
                    <FaLeaf className="account-help-icon" aria-hidden />
                    <span className="account-help-title">Dietary requirements</span>
                    <span className="account-help-desc">Allergens and special diets</span>
                  </Link>
                  <Link to="/faqs" className="account-help-card">
                    <FaQuestionCircle className="account-help-icon" aria-hidden />
                    <span className="account-help-title">FAQs</span>
                    <span className="account-help-desc">Common questions answered</span>
                  </Link>
                  <Link to="/terms-and-conditions" className="account-help-card">
                    <FaBalanceScale className="account-help-icon" aria-hidden />
                    <span className="account-help-title">Terms &amp; conditions</span>
                    <span className="account-help-desc">Orders, pickups, and policies</span>
                  </Link>
                  <Link to="/contact" className="account-help-card">
                    <FaEnvelope className="account-help-icon" aria-hidden />
                    <span className="account-help-title">Contact</span>
                    <span className="account-help-desc">Custom requests and large orders</span>
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {reviewItem && (
        <ReviewModal
          isOpen
          onClose={() => {
            setReviewItem(null);
            loadOrders();
          }}
          item={reviewItem}
          orderId={reviewItem.orderId}
        />
      )}
    </div>
  );
};

export default AccountPage;

import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaBell, 
  FaLock, 
  FaPalette, 
  FaLanguage, 
  FaCreditCard, 
  FaTruck, 
  FaMapMarkerAlt 
} from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      notifications: true,
      emailNotifications: true,
      marketingEmails: false,
      orderUpdates: true,
      deliveryUpdates: true
    },
    appearance: {
      theme: 'light'
    },
    language: {
      language: 'en'
    },
    payment: {
      defaultPaymentMethod: 'card',
      savedCards: []
    },
    delivery: {
      defaultDeliveryAddress: null,
      savedAddresses: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    paypalEmail: '',
    isDefault: false
  });
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    streetAddress: '',
    apartment: '',
    city: '',
    postcode: '',
    phone: '',
    isDefault: false,
    label: 'home' // home, work, other
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (auth.currentUser) {
        try {
          const categories = ['notifications', 'appearance', 'language', 'payment', 'delivery'];
          const newSettings = { ...settings };

          for (const category of categories) {
            const settingDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'Settings', category));
            if (settingDoc.exists()) {
              // Merge with defaults to ensure all required fields exist
              newSettings[category] = {
                ...newSettings[category],
                ...settingDoc.data()
              };
            }
          }

          setSettings(newSettings);
        } catch (error) {
          console.error('Error fetching settings:', error);
          setSaveError('Failed to load settings');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleSettingChange = async (category, setting, value) => {
    try {
      setSaveError(null);
      
      // Update local state
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [setting]: value
        }
      };
      setSettings(newSettings);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update the specific category document in Firestore
      const settingRef = doc(db, 'users', user.uid, 'Settings', category);
      await setDoc(settingRef, newSettings[category], { merge: true });

    } catch (error) {
      console.error('Error updating settings:', error);
      setSaveError('Failed to save settings. Please try again.');
      // Revert the setting change in local state
      setSettings(prev => ({ ...prev }));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setDeleteError('No user logged in');
        return;
      }

      if (!showPasswordInput) {
        setShowPasswordInput(true);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);

      // Delete user's Firestore data
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user's authentication account
      await deleteUser(user);

      // Navigate to home page after successful deletion
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setSaveError(null);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Basic validation
      if (newPaymentMethod.type === 'card') {
        if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvv || !newPaymentMethod.cardholderName) {
          throw new Error('Please fill in all card details');
        }
      } else if (newPaymentMethod.type === 'paypal' && !newPaymentMethod.paypalEmail) {
        throw new Error('Please enter your PayPal email');
      }

      // Mask card number for storage (only keep last 4 digits)
      const maskedPaymentMethod = {
        ...newPaymentMethod,
        cardNumber: newPaymentMethod.cardNumber ? `****${newPaymentMethod.cardNumber.slice(-4)}` : '',
        cvv: '***'
      };

      // Add to savedCards array
      const updatedPayment = {
        ...settings.payment,
        savedCards: [...settings.payment.savedCards, {
          ...maskedPaymentMethod,
          id: Date.now().toString(),
          addedAt: new Date().toISOString()
        }]
      };

      // If this is the first card or marked as default, update defaultPaymentMethod
      if (newPaymentMethod.isDefault || updatedPayment.savedCards.length === 1) {
        updatedPayment.defaultPaymentMethod = newPaymentMethod.type;
      }

      // Update Firestore
      const settingRef = doc(db, 'users', user.uid, 'Settings', 'payment');
      await setDoc(settingRef, updatedPayment, { merge: true });

      // Update local state
      setSettings(prev => ({
        ...prev,
        payment: updatedPayment
      }));

      // Reset form
      setNewPaymentMethod({
        type: 'card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        paypalEmail: '',
        isDefault: false
      });
      setShowNewPaymentForm(false);

    } catch (error) {
      console.error('Error adding payment method:', error);
      setSaveError(error.message || 'Failed to add payment method');
    }
  };

  const handleRemovePaymentMethod = async (paymentId) => {
    try {
      setSaveError(null);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const updatedCards = settings.payment.savedCards.filter(card => card.id !== paymentId);
      const updatedPayment = {
        ...settings.payment,
        savedCards: updatedCards
      };

      // If we removed the default payment method, update it
      if (updatedCards.length > 0 && !updatedCards.find(card => card.type === settings.payment.defaultPaymentMethod)) {
        updatedPayment.defaultPaymentMethod = updatedCards[0].type;
      }

      // Update Firestore
      const settingRef = doc(db, 'users', user.uid, 'Settings', 'payment');
      await setDoc(settingRef, updatedPayment, { merge: true });

      // Update local state
      setSettings(prev => ({
        ...prev,
        payment: updatedPayment
      }));

    } catch (error) {
      console.error('Error removing payment method:', error);
      setSaveError('Failed to remove payment method');
    }
  };

  const handleAddAddress = async () => {
    try {
      setSaveError(null);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Basic validation
      if (!newAddress.name || !newAddress.streetAddress || !newAddress.city || 
          !newAddress.postcode || !newAddress.phone) {
        throw new Error('Please fill in all required fields');
      }

      // Validate UK postcode format
      const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
      if (!postcodeRegex.test(newAddress.postcode.trim())) {
        throw new Error('Please enter a valid UK postcode');
      }

      // Format postcode to uppercase and create new address object
      const newAddressWithId = {
        ...newAddress,
        postcode: newAddress.postcode.toUpperCase().trim(),
        id: Date.now().toString(),
        addedAt: new Date().toISOString()
      };

      // Create updated delivery settings
      const updatedDelivery = {
        ...settings.delivery,
        savedAddresses: [...(settings.delivery.savedAddresses || []), newAddressWithId]
      };

      // If this is the first address or marked as default, update defaultDeliveryAddress
      if (newAddress.isDefault || !updatedDelivery.defaultDeliveryAddress) {
        updatedDelivery.defaultDeliveryAddress = newAddressWithId.id;
      }

      // Update Firestore
      const settingRef = doc(db, 'users', user.uid, 'Settings', 'delivery');
      await setDoc(settingRef, updatedDelivery);

      // Update local state
      setSettings(prev => ({
        ...prev,
        delivery: updatedDelivery
      }));

      // Reset form
      setNewAddress({
        name: '',
        streetAddress: '',
        apartment: '',
        city: '',
        postcode: '',
        phone: '',
        isDefault: false,
        label: 'home'
      });
      setShowNewAddressForm(false);

      // Show success message
      setSaveError('Address saved successfully!');
      setTimeout(() => setSaveError(null), 3000);

    } catch (error) {
      console.error('Error adding address:', error);
      setSaveError(error.message || 'Failed to add address');
    }
  };

  const handleRemoveAddress = async (addressId) => {
    try {
      setSaveError(null);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const updatedAddresses = settings.delivery.savedAddresses.filter(addr => addr.id !== addressId);
      const updatedDelivery = {
        ...settings.delivery,
        savedAddresses: updatedAddresses
      };

      // If we removed the default address, update it
      if (settings.delivery.defaultDeliveryAddress === addressId && updatedAddresses.length > 0) {
        updatedDelivery.defaultDeliveryAddress = updatedAddresses[0].id;
      }

      // Update Firestore
      const settingRef = doc(db, 'users', user.uid, 'Settings', 'delivery');
      await setDoc(settingRef, updatedDelivery, { merge: true });

      // Update local state
      setSettings(prev => ({
        ...prev,
        delivery: updatedDelivery
      }));

    } catch (error) {
      console.error('Error removing address:', error);
      setSaveError('Failed to remove address');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
      setChangePasswordSuccess('Password changed successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setChangePasswordSuccess(null), 3000);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setChangePasswordError('Incorrect current password.');
      } else {
        setChangePasswordError(error.message || 'Failed to change password.');
      }
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>Settings</h2>
        
        {saveError && (
          <div className="settings-error">
            {saveError}
          </div>
        )}
        
        {changePasswordSuccess && (
          <div className="settings-error" style={{ background: '#e6ffed', color: '#27ae60', border: '1px solid #b2f2bb' }}>
            {changePasswordSuccess}
          </div>
        )}
        
        {changePasswordError && (
          <div className="settings-error">
            {changePasswordError}
          </div>
        )}
        
        <div className="settings-section">
          <h3><FaBell /> Notifications</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.notifications}
                onChange={(e) => handleSettingChange('notifications', 'notifications', e.target.checked)}
              />
              Enable Notifications
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
              />
              Email Notifications
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.orderUpdates}
                onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
              />
              Order Status Updates
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.deliveryUpdates}
                onChange={(e) => handleSettingChange('notifications', 'deliveryUpdates', e.target.checked)}
              />
              Delivery Updates
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.marketingEmails}
                onChange={(e) => handleSettingChange('notifications', 'marketingEmails', e.target.checked)}
              />
              Marketing Emails
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaCreditCard /> Payment Methods</h3>
          
          {/* Saved Payment Methods */}
          {settings.payment.savedCards.length > 0 && (
            <div className="saved-payment-methods">
              <h4>Saved Payment Methods</h4>
              {settings.payment.savedCards.map((card) => (
                <div key={card.id} className="saved-payment-method">
                  <div className="payment-info">
                    {card.type === 'card' ? (
                      <>
                        <span className="card-number">{card.cardNumber}</span>
                        <span className="card-name">{card.cardholderName}</span>
                        <span className="card-expiry">Expires: {card.expiryDate}</span>
                      </>
                    ) : (
                      <span className="paypal-email">{card.paypalEmail}</span>
                    )}
                    {settings.payment.defaultPaymentMethod === card.type && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <button 
                    className="remove-payment"
                    onClick={() => handleRemovePaymentMethod(card.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Payment Method */}
          {!showNewPaymentForm ? (
            <button 
              className="add-payment"
              onClick={() => setShowNewPaymentForm(true)}
            >
              Add New Payment Method
            </button>
          ) : (
            <div className="new-payment-form">
              <h4>Add New Payment Method</h4>
              <div className="setting-item">
                <label>Payment Type</label>
                <select
                  value={newPaymentMethod.type}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {newPaymentMethod.type === 'card' ? (
                <>
                  <div className="setting-item">
                    <label>Card Number</label>
                    <input
                      type="text"
                      value={newPaymentMethod.cardNumber}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                    />
                  </div>
                  <div className="setting-item">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      value={newPaymentMethod.cardholderName}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="setting-item card-details">
                    <div>
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        value={newPaymentMethod.expiryDate}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                    </div>
                    <div>
                      <label>CVV</label>
                      <input
                        type="text"
                        value={newPaymentMethod.cvv}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                        maxLength="4"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="setting-item">
                  <label>PayPal Email</label>
                  <input
                    type="email"
                    value={newPaymentMethod.paypalEmail}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
              )}

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={newPaymentMethod.isDefault}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  Set as default payment method
                </label>
              </div>

              <div className="payment-form-buttons">
                <button 
                  className="save-payment"
                  onClick={handleAddPaymentMethod}
                >
                  Save Payment Method
                </button>
                <button 
                  className="cancel-payment"
                  onClick={() => {
                    setShowNewPaymentForm(false);
                    setNewPaymentMethod({
                      type: 'card',
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                      cardholderName: '',
                      paypalEmail: '',
                      isDefault: false
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3><FaTruck /> Delivery Preferences</h3>
          
          {/* Saved Addresses */}
          {settings.delivery.savedAddresses?.length > 0 && (
            <div className="saved-addresses">
              <h4>Saved Addresses</h4>
              {settings.delivery.savedAddresses.map((address) => (
                <div key={address.id} className="saved-address">
                  <div className="address-info">
                    <div className="address-header">
                      <span className="address-name">{address.name}</span>
                      <span className={`address-label ${address.label}`}>{address.label}</span>
                      {settings.delivery.defaultDeliveryAddress === address.id && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>
                    <div className="address-details">
                      <p>{address.streetAddress}</p>
                      {address.apartment && <p>Apt/Suite: {address.apartment}</p>}
                      <p>{address.city}</p>
                      <p>{address.postcode}</p>
                      <p className="address-phone">{address.phone}</p>
                    </div>
                  </div>
                  <button 
                    className="remove-address"
                    onClick={() => handleRemoveAddress(address.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Address */}
          {!showNewAddressForm ? (
            <button 
              className="add-address"
              onClick={() => setShowNewAddressForm(true)}
            >
              Add New Address
            </button>
          ) : (
            <div className="new-address-form">
              <h4>Add New Address</h4>
              <div className="setting-item">
                <label>Full Name*</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="setting-item">
                <label>Street Address*</label>
                <input
                  type="text"
                  value={newAddress.streetAddress}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                  placeholder="123 High Street"
                />
              </div>
              <div className="setting-item">
                <label>Apartment/Suite</label>
                <input
                  type="text"
                  value={newAddress.apartment}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, apartment: e.target.value }))}
                  placeholder="Flat 4B (Optional)"
                />
              </div>
              <div className="address-details-grid">
                <div className="setting-item">
                  <label>City/Town*</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="London"
                  />
                </div>
                <div className="setting-item">
                  <label>Postcode*</label>
                  <input
                    type="text"
                    value={newAddress.postcode}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, postcode: e.target.value }))}
                    placeholder="SW1A 1AA"
                    maxLength="8"
                  />
                </div>
              </div>
              <div className="setting-item">
                <label>Phone Number*</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="07123 456789"
                />
              </div>
              <div className="setting-item">
                <label>Address Label</label>
                <select
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  Set as default delivery address
                </label>
              </div>

              <div className="address-form-buttons">
                <button 
                  className="save-address"
                  onClick={handleAddAddress}
                >
                  Save Address
                </button>
                <button 
                  className="cancel-address"
                  onClick={() => {
                    setShowNewAddressForm(false);
                    setNewAddress({
                      name: '',
                      streetAddress: '',
                      apartment: '',
                      city: '',
                      postcode: '',
                      phone: '',
                      isDefault: false,
                      label: 'home'
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3><FaPalette /> Appearance</h3>
          <div className="setting-item">
            <label>Theme</label>
            <select
              value={settings.appearance.theme}
              onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaLanguage /> Language</h3>
          <div className="setting-item">
            <label>Language</label>
            <select
              value={settings.language.language}
              onChange={(e) => handleSettingChange('language', 'language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaLock /> Privacy & Security</h3>
          <div className="setting-item">
            {!showChangePassword ? (
              <button className="change-password" onClick={() => setShowChangePassword(true)}>Change Password</button>
            ) : (
              <form className="change-password-form" onSubmit={handleChangePassword}>
                <div className="setting-item">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="setting-item">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="setting-item">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="payment-form-buttons">
                  <button type="submit" className="save-payment">Change Password</button>
                  <button type="button" className="cancel-payment" onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setChangePasswordError(null);
                  }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
          <div className="setting-item">
            {!deleteConfirm ? (
              <button 
                className="delete-account"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <div className="delete-confirmation">
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                {deleteError && <p className="error-message">{deleteError}</p>}
                {showPasswordInput && (
                  <div className="password-input">
                    <label>Enter your password to confirm:</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                )}
                <div className="confirmation-buttons">
                  <button 
                    className="confirm-delete"
                    onClick={handleDeleteAccount}
                  >
                    {showPasswordInput ? 'Confirm Delete' : 'Yes, Delete Account'}
                  </button>
                  <button 
                    className="cancel-delete"
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteError(null);
                      setShowPasswordInput(false);
                      setPassword('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import '../../styles/DiscountManagement.css';

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    percentage: '',
    minPurchase: '',
    maxDiscount: '',
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const discountsSnapshot = await getDocs(collection(db, 'Discount Codes'));
      const discountsList = discountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscounts(discountsList);
    } catch (err) {
      setError('Failed to fetch discount codes');
      console.error('Error fetching discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.code || !formData.description || !formData.percentage) {
      setError('Please fill in all required fields');
      return false;
    }
    if (isNaN(formData.percentage) || formData.percentage < 0 || formData.percentage > 100) {
      setError('Percentage must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleClearField = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const discountData = {
        ...formData,
        code: formData.code.toUpperCase(),
        percentage: Number(formData.percentage),
        minPurchase: formData.minPurchase ? Number(formData.minPurchase) : null,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        expiryDate: formData.expiryDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingDiscount) {
        await updateDoc(doc(db, 'Discount Codes', editingDiscount.id), discountData);
      } else {
        await addDoc(collection(db, 'Discount Codes'), discountData);
      }

      await fetchDiscounts();
      resetForm();
    } catch (err) {
      setError('Failed to save discount code');
      console.error('Error saving discount:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description,
      percentage: discount.percentage,
      minPurchase: discount.minPurchase || '',
      maxDiscount: discount.maxDiscount || '',
      expiryDate: discount.expiryDate || '',
      isActive: discount.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'Discount Codes', id));
      await fetchDiscounts();
    } catch (err) {
      setError('Failed to delete discount code');
      console.error('Error deleting discount:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      percentage: '',
      minPurchase: '',
      maxDiscount: '',
      expiryDate: '',
      isActive: true
    });
    setEditingDiscount(null);
    setShowAddForm(false);
  };

  if (loading && !discounts.length) {
    return <div className="loading">Loading discount codes...</div>;
  }

  return (
    <div className="discount-management">
      <div className="discount-header">
        <h2>Discount Codes</h2>
        <button 
          className="add-discount-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Discount'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="discount-form">
          <h3>{editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}</h3>
          
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="e.g., SUMMER2024"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Summer Sale 2024"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="percentage">Discount Percentage *</label>
              <input
                type="number"
                id="percentage"
                name="percentage"
                value={formData.percentage}
                onChange={handleInputChange}
                placeholder="e.g., 20"
                min="0"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="minPurchase">
                Minimum Purchase
                {formData.minPurchase && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearField('minPurchase')}
                    title="Remove minimum purchase requirement"
                  >
                    ×
                  </button>
                )}
              </label>
              <input
                type="number"
                id="minPurchase"
                name="minPurchase"
                value={formData.minPurchase}
                onChange={handleInputChange}
                placeholder="No minimum"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxDiscount">
                Maximum Discount
                {formData.maxDiscount && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearField('maxDiscount')}
                    title="Remove maximum discount limit"
                  >
                    ×
                  </button>
                )}
              </label>
              <input
                type="number"
                id="maxDiscount"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleInputChange}
                placeholder="No maximum"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">
                Expiry Date
                {formData.expiryDate && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearField('expiryDate')}
                    title="Remove expiry date (never expires)"
                  >
                    ×
                  </button>
                )}
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                placeholder="Never expires"
              />
              {!formData.expiryDate && (
                <span className="field-hint">Code will never expire</span>
              )}
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              {editingDiscount ? 'Update Discount' : 'Create Discount'}
            </button>
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="discounts-list">
        {discounts.map(discount => (
          <div key={discount.id} className={`discount-card ${!discount.isActive ? 'inactive' : ''}`}>
            <div className="discount-card-header">
              <h3>{discount.code}</h3>
              <div className="discount-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEdit(discount)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(discount.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="discount-details">
              <p>{discount.description}</p>
              <p className="discount-percentage">{discount.percentage}% OFF</p>
              {discount.minPurchase && (
                <p className="min-purchase">Min. Purchase: £{discount.minPurchase}</p>
              )}
              {discount.maxDiscount && (
                <p className="max-discount">Max. Discount: £{discount.maxDiscount}</p>
              )}
              {discount.expiryDate ? (
                <p className="expiry-date">Expires: {new Date(discount.expiryDate).toLocaleDateString()}</p>
              ) : (
                <p className="expiry-date">No expiration date</p>
              )}
              <span className={`status-badge ${discount.isActive ? 'active' : 'inactive'}`}>
                {discount.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscountManagement; 
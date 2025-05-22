import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../../firebase/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCopy } from 'react-icons/fa';
import '../../styles/CakeManagement.css';
import ConfirmModal from './ConfirmModal';
import CupcakeForm from './forms/CupcakeForm';
import BentocakeForm from './forms/BentocakeForm';
import BrowniesForm from './forms/BrowniesForm';
import CookiesForm from './forms/CookiesForm';
import RegularForm from './forms/RegularForm';

// Fixed categories
const FIXED_CATEGORIES = [
  'Cupcakes',
  'Large Cakes',
  'Bento Cake with Cupcakes',
  'Brownies',
  'Cookies',
  'Vegan Range',
  'Gluten Free',
  'Subscription Boxes',
];

const CATEGORY_TABS = [
  { key: 'Cupcakes', label: 'Cupcakes' },
  { key: 'Bento Cake with Cupcakes', label: 'Bento Cake' },
  { key: 'Brownies', label: 'Brownies' },
  { key: 'Cookies', label: 'Cookies' },
  { key: 'Regular Cakes', label: 'Regular Cakes' },
];

const CakeManagement = ({ cakes, onUpdate }) => {
  const [showNewCakeForm, setShowNewCakeForm] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [cakeImage, setCakeImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCake, setNewCake] = useState({
    name: '',
    description: '',
    sizes: [],
    categories: [],
    shapes: [],
    finishes: [],
    dimensions: {
      unit: 'inch'
    },
    ingredients: [''],
    allergens: [''],
    customizationOptions: [''],
    isAvailable: true,
    featured: false,
    isSeasonal: false,
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isNutFree: false,
      isDairyFree: false
    },
    fillings: [],
    relatedProducts: []
  });

  const [newSize, setNewSize] = useState({
    size: '',
    price: '',
    servingSize: ''
  });

  const [newShape, setNewShape] = useState({ name: '', price: '' });
  const [newFinish, setNewFinish] = useState({ name: '', price: '' });

  const [confirmModal, setConfirmModal] = useState({ open: false, cakeId: null, imageUrl: null });

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdminUser = userData.isAdmin || userData.isDeveloper;
            setIsAdmin(isAdminUser);
            setDebugInfo(`User ${user.uid} is ${isAdminUser ? 'admin' : 'not admin'}`);
          } else {
            setDebugInfo(`User document not found for ${user.uid}`);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setError('Failed to verify admin status');
          setDebugInfo(`Error checking admin status: ${error.message}`);
        }
      } else {
        setDebugInfo('No authenticated user');
      }
    };
    checkAdminStatus();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setCakeImage(e.target.files[0]);
    }
  };

  const handleArrayFieldAdd = (field) => {
    setNewCake({
      ...newCake,
      [field]: [...newCake[field], '']
    });
  };

  const handleArrayFieldRemove = (field, index) => {
    setNewCake({
      ...newCake,
      [field]: newCake[field].filter((_, i) => i !== index)
    });
  };

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...newCake[field]];
    newArray[index] = value;
    setNewCake({
      ...newCake,
      [field]: newArray
    });
  };

  const handleAddSize = () => {
    if (selectedCategory === 'Brownies' || selectedCategory === 'Cookies') {
      if (!newSize.size || !newSize.price) return;
      setNewCake({
        ...newCake,
        sizes: [...newCake.sizes, {
          size: newSize.size,
          price: parseFloat(newSize.price)
        }]
      });
      setNewSize({ size: '', price: '' });
    } else {
      if (!newSize.size || !newSize.price || !newSize.servingSize) return;
      setNewCake({
        ...newCake,
        sizes: [...newCake.sizes, {
          ...newSize,
          price: parseFloat(newSize.price),
          servingSize: parseInt(newSize.servingSize, 10)
        }]
      });
      setNewSize({
        size: '',
        price: '',
        servingSize: ''
      });
    }
  };

  const handleRemoveSize = (index) => {
    setNewCake({
      ...newCake,
      sizes: newCake.sizes.filter((_, i) => i !== index)
    });
  };

  const handleAddShape = () => {
    if (!newShape.name.trim() || newShape.price === '') return;
    setNewCake({
      ...newCake,
      shapes: [...newCake.shapes, { name: newShape.name.trim(), price: parseFloat(newShape.price) }]
    });
    setNewShape({ name: '', price: '' });
  };

  const handleRemoveShape = (index) => {
    setNewCake({
      ...newCake,
      shapes: newCake.shapes.filter((_, i) => i !== index)
    });
  };

  const handleAddFinish = () => {
    if (!newFinish.name.trim() || newFinish.price === '') return;
    setNewCake({
      ...newCake,
      finishes: [...newCake.finishes, { name: newFinish.name.trim(), price: parseFloat(newFinish.price) }]
    });
    setNewFinish({ name: '', price: '' });
  };

  const handleRemoveFinish = (index) => {
    setNewCake({
      ...newCake,
      finishes: newCake.finishes.filter((_, i) => i !== index)
    });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category !== 'Regular Cakes') {
      setNewCake(prevCake => ({
        ...prevCake,
        categories: [category]
      }));
    }
  };

  const handleAddFilling = () => {
    setNewCake({
      ...newCake,
      fillings: [...newCake.fillings, { name: '', price: '' }]
    });
  };

  const handleRemoveFilling = (index) => {
    setNewCake({
      ...newCake,
      fillings: newCake.fillings.filter((_, i) => i !== index)
    });
  };

  const handleFillingChange = (index, field, value) => {
    const newFillings = [...newCake.fillings];
    newFillings[index] = {
      ...newFillings[index],
      [field]: field === 'price' ? parseFloat(value) : value
    };
    setNewCake({
      ...newCake,
      fillings: newFillings
    });
  };

  const getCleanedCakeData = () => {
    let cleaned = { ...newCake };
    switch (selectedCategory) {
      case 'Cupcakes':
        cleaned = {
          name: newCake.name,
          categories: newCake.categories,
          sizes: newCake.sizes,
          quantities: newCake.quantities,
          description: newCake.description,
          ingredients: newCake.ingredients,
          occasions: newCake.occasions,
          toppers: newCake.toppers,
          decorationStyles: newCake.decorationStyles,
          addOns: newCake.addOns,
          relatedProducts: newCake.relatedProducts,
          image: newCake.image,
          isAvailable: newCake.isAvailable,
          featured: newCake.featured,
          isSeasonal: newCake.isSeasonal,
        };
        break;
      case 'Bento Cake with Cupcakes':
        cleaned = {
          name: newCake.name,
          categories: newCake.categories,
          flavours: newCake.flavours,
          size: newCake.size,
          description: newCake.description,
          ingredients: newCake.ingredients,
          toppers: newCake.toppers,
          decorationStyles: newCake.decorationStyles,
          addOns: newCake.addOns,
          relatedProducts: newCake.relatedProducts,
          image: newCake.image,
          isAvailable: newCake.isAvailable,
          featured: newCake.featured,
          isSeasonal: newCake.isSeasonal,
        };
        break;
      case 'Brownies':
        cleaned = {
          name: newCake.name,
          categories: newCake.categories,
          sizes: newCake.sizes,
          quantities: newCake.quantities,
          description: newCake.description,
          ingredients: newCake.ingredients,
          addOns: newCake.addOns,
          relatedProducts: newCake.relatedProducts,
          image: newCake.image,
          isAvailable: newCake.isAvailable,
          featured: newCake.featured,
          isSeasonal: newCake.isSeasonal,
        };
        break;
      case 'Cookies':
        cleaned = {
          name: newCake.name,
          categories: newCake.categories,
          sizes: newCake.sizes,
          quantities: newCake.quantities,
          description: newCake.description,
          ingredients: newCake.ingredients,
          addOns: newCake.addOns,
          relatedProducts: newCake.relatedProducts,
          image: newCake.image,
          isAvailable: newCake.isAvailable,
          featured: newCake.featured,
          isSeasonal: newCake.isSeasonal,
        };
        break;
      default: // Regular Cakes
        // Keep all fields, as RegularForm allows full customization
        break;
    }
    cleaned.createdAt = new Date().toISOString();
    cleaned.updatedAt = new Date().toISOString();
    return cleaned;
  };

  const handleCakeSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      let imageUrl = '';

      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is admin or developer
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      if (!userData.isAdmin && !userData.isDeveloper) {
        throw new Error('User does not have permission to manage cakes');
      }

      if (cakeImage) {
        // Validate image size (5MB max)
        if (cakeImage.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        // Validate image type
        if (!cakeImage.type.startsWith('image/')) {
          throw new Error('File must be an image');
        }

        const storageRef = ref(storage, `cakes/${cakeImage.name}_${Date.now()}`);
        await uploadBytes(storageRef, cakeImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (imageUrl) {
        newCake.image = imageUrl;
      }

      // Ensure category is set
      if (!newCake.categories || newCake.categories.length === 0) {
        throw new Error('Category must be selected');
      }

      const cleanedCake = getCleanedCakeData();

      if (editingCake) {
        await updateDoc(doc(db, 'cakes', editingCake.id), cleanedCake);
      } else {
        await addDoc(collection(db, 'cakes'), cleanedCake);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      setError(error.message || 'Failed to save cake');
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCake = async (cakeId, imageUrl) => {
    setConfirmModal({ open: true, cakeId, imageUrl });
  };

  const confirmDelete = async () => {
    const { cakeId, imageUrl } = confirmModal;
    setConfirmModal({ open: false, cakeId: null, imageUrl: null });
    try {
      setLoading(true);
      // Only delete image from storage if no other cakes reference it
      if (imageUrl) {
        const cakesCol = collection(db, 'cakes');
        const cakesSnap = await getDocs(cakesCol);
        const otherCakesWithImage = cakesSnap.docs.filter(docSnap => {
          const data = docSnap.data();
          return docSnap.id !== cakeId && data.image === imageUrl;
        });
        if (otherCakesWithImage.length === 0) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }
      }
      await deleteDoc(doc(db, 'cakes', cakeId));
      onUpdate();
    } catch (error) {
      console.error('Error deleting cake:', error);
      setError('Failed to delete cake');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCake = (cake) => {
    setEditingCake(cake);
    setNewCake({ ...cake, relatedProducts: cake.relatedProducts || [] });
    setShowNewCakeForm(true);
  };

  const handleDuplicateCake = async (cake) => {
    try {
      setLoading(true);
      setError(null);
      // Remove id and timestamps for duplication, but keep image
      const { id, createdAt, updatedAt, ...cakeData } = cake;
      await addDoc(collection(db, 'cakes'), {
        ...cakeData,
        name: cakeData.name + ' (Copy)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onUpdate();
    } catch (error) {
      setError('Failed to duplicate cake');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowNewCakeForm(false);
    setEditingCake(null);
    setCakeImage(null);
    setSelectedCategory(null);
    setNewCake({
      name: '',
      description: '',
      sizes: [],
      categories: [],
      shapes: [],
      finishes: [],
      servingSize: '',
      dimensions: {
        unit: 'inch'
      },
      ingredients: [''],
      allergens: [''],
      customizationOptions: [''],
      isAvailable: true,
      featured: false,
      isSeasonal: false,
      dietaryInfo: {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isNutFree: false,
        isDairyFree: false
      },
      fillings: [],
      relatedProducts: []
    });
  };

  const renderFormByCategory = () => {
    switch (selectedCategory) {
      case 'Cupcakes':
        return (
          <CupcakeForm
            newCake={newCake}
            setNewCake={setNewCake}
            newSize={newSize}
            setNewSize={setNewSize}
            handleAddSize={handleAddSize}
            handleRemoveSize={handleRemoveSize}
            cakes={cakes}
            editingCake={editingCake}
          />
        );
      case 'Bento Cake with Cupcakes':
        return (
          <BentocakeForm
            newCake={newCake}
            setNewCake={setNewCake}
            cakes={cakes}
            editingCake={editingCake}
          />
        );
      case 'Brownies':
        return (
          <BrowniesForm
            newCake={newCake}
            setNewCake={setNewCake}
            newSize={newSize}
            setNewSize={setNewSize}
            handleAddSize={handleAddSize}
            handleRemoveSize={handleRemoveSize}
            cakes={cakes}
            editingCake={editingCake}
          />
        );
      case 'Cookies':
        return (
          <CookiesForm
            newCake={newCake}
            setNewCake={setNewCake}
            newSize={newSize}
            setNewSize={setNewSize}
            handleAddSize={handleAddSize}
            handleRemoveSize={handleRemoveSize}
            cakes={cakes}
            editingCake={editingCake}
          />
        );
      default:
        return (
          <RegularForm
            newCake={newCake}
            setNewCake={setNewCake}
            newSize={newSize}
            setNewSize={setNewSize}
            handleAddSize={handleAddSize}
            handleRemoveSize={handleRemoveSize}
            handleAddShape={handleAddShape}
            handleRemoveShape={handleRemoveShape}
            newShape={newShape}
            setNewShape={setNewShape}
            handleAddFinish={handleAddFinish}
            handleRemoveFinish={handleRemoveFinish}
            newFinish={newFinish}
            setNewFinish={setNewFinish}
            cakes={cakes}
            editingCake={editingCake}
          />
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="cakemanagement-error">
        You do not have permission to manage cakes.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cakemanagement-loading"></div>
    );
  }

  return (
    <div className="cakemanagement-section">
      {debugInfo && (
        <div className="cakemanagement-debug">
          Debug Info: {debugInfo}
        </div>
      )}
      <div className="cakemanagement-header">
        <h2>Cake Management</h2>
        <div className="cakemanagement-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              className={`cakemanagement-tab-btn${selectedCategory === tab.key ? ' active' : ''}`}
              onClick={() => {
                handleCategorySelect(tab.key);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="cakemanagement-add-buttons">
          <button
            className={`cakemanagement-add-btn${showNewCakeForm ? ' open' : ''}`}
            onClick={() => setShowNewCakeForm(f => !f)}
          >
            <FaPlus /> Add {selectedCategory ? CATEGORY_TABS.find(tab => tab.key === selectedCategory).label : 'Cake'}
          </button>
        </div>
      </div>

      {error && (
        <div className="cakemanagement-error">
          {error}
        </div>
      )}

      {showNewCakeForm && (
        <div className={`cakemanagement-form-slide${showNewCakeForm ? ' open' : ''}`}>
          <div className="cakemanagement-form-container">
            <button
              type="button"
              className="cakemanagement-form-close-btn"
              onClick={resetForm}
              aria-label="Close form"
            >
              &times;
            </button>
            <h3>{editingCake ? 'Edit Cake' : `Add New ${selectedCategory || 'Cake'}`}</h3>
            <form onSubmit={handleCakeSubmit} className="cakemanagement-form">
              <div className="cakemanagement-form-grid">
                {!selectedCategory && (
                  <div className="cakemanagement-form-group full-width">
                    <label>Categories*</label>
                    <div className="cakemanagement-categories">
                      {FIXED_CATEGORIES.map((category) => (
                        <label key={category} className="cakemanagement-category-checkbox">
                          <input
                            type="checkbox"
                            checked={newCake.categories.includes(category)}
                            onChange={(e) => {
                              const updatedCategories = e.target.checked
                                ? [...newCake.categories, category]
                                : newCake.categories.filter(cat => cat !== category);
                              setNewCake({ ...newCake, categories: updatedCategories });
                            }}
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="cakemanagement-form-group">
                  <label>Name*</label>
                  <input
                    type="text"
                    value={newCake.name}
                    onChange={(e) => setNewCake({ ...newCake, name: e.target.value })}
                    required
                  />
                </div>
                {renderFormByCategory()}

                <div className="cakemanagement-form-group full-width">
                  <label>Related Products (max 3)</label>
                  <div className="cakemanagement-related-products-list">
                    {cakes
                      .filter(c => !editingCake || c.id !== editingCake.id) // Exclude self when editing
                      .map(cakeOption => (
                        <label key={cakeOption.id} className="cakemanagement-related-checkbox">
                          <input
                            type="checkbox"
                            checked={newCake.relatedProducts && newCake.relatedProducts.includes(cakeOption.id)}
                            disabled={
                              !(newCake.relatedProducts && newCake.relatedProducts.includes(cakeOption.id)) &&
                              newCake.relatedProducts && newCake.relatedProducts.length >= 3
                            }
                            onChange={e => {
                              let updated;
                              if (e.target.checked) {
                                updated = [...(newCake.relatedProducts || []), cakeOption.id];
                              } else {
                                updated = (newCake.relatedProducts || []).filter(id => id !== cakeOption.id);
                              }
                              setNewCake({ ...newCake, relatedProducts: updated });
                            }}
                          />
                          {cakeOption.name}
                        </label>
                      ))}
                  </div>
                </div>

                <div className="cakemanagement-form-group">
                  <label>Cake Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {editingCake && editingCake.image && (
                    <div className="cakemanagement-current-image">
                      <img src={editingCake.image} alt="Current cake" />
                      <p>Current image will be kept if no new image is uploaded</p>
                    </div>
                  )}
                </div>

                <div className="cakemanagement-form-group availability-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.isAvailable}
                      onChange={(e) => setNewCake({...newCake, isAvailable: e.target.checked})}
                    />
                    Available for Purchase
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.featured}
                      onChange={(e) => setNewCake({...newCake, featured: e.target.checked})}
                    />
                    Featured Cake
                  </label>
                </div>

                <div className="cakemanagement-form-group">
                  <label>Availability Period</label>
                  <div className="cakemanagement-availability-period">
                    <label className="cakemanagement-radio-label">
                      <input
                        type="radio"
                        name="availabilityPeriod"
                        checked={!newCake.isSeasonal}
                        onChange={() => setNewCake({...newCake, isSeasonal: false})}
                      />
                      Year Round
                    </label>
                    <label className="cakemanagement-radio-label">
                      <input
                        type="radio"
                        name="availabilityPeriod"
                        checked={newCake.isSeasonal}
                        onChange={() => setNewCake({...newCake, isSeasonal: true})}
                      />
                      Seasonal
                    </label>
                  </div>
                </div>
              </div>

              <div className="cakemanagement-form-actions">
                <button type="submit" className="cakemanagement-save-btn">
                  {editingCake ? 'Update Cake' : 'Add Cake'}
                </button>
                <button 
                  type="button" 
                  className="cakemanagement-cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="cakemanagement-grid">
        {Array.isArray(cakes) ? cakes.map((cake) => (
          <div key={cake.id} className="cakemanagement-card">
            <div className="cakemanagement-card-image">
              <img src={cake.image} alt={cake.name} />
            </div>
            <div className="cakemanagement-card-content">
              <h3>{cake.name}</h3>
              <div className="cakemanagement-sizes-list">
                {(Array.isArray(cake.sizes) ? cake.sizes : []).map((size, index) => (
                  <div key={index} className="cakemanagement-size-badge">
                    <span>{Array.isArray(cake.categories) && cake.categories.includes('Cupcakes') ? `${size.size} cupcakes` : `${size.size}"`}</span>
                    <span>£{size.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cakemanagement-shapes-list">
                {(Array.isArray(cake.shapes) ? cake.shapes : []).map((shape, idx) => (
                  <span key={idx} className="cakemanagement-shape-badge">{shape.name} +£{shape.price.toFixed(2)}</span>
                ))}
              </div>
              <div className="cakemanagement-finishes-list">
                {(Array.isArray(cake.finishes) ? cake.finishes : []).map((finish, idx) => (
                  <span key={idx} className="cakemanagement-finish-badge">{finish.name} +£{finish.price.toFixed(2)}</span>
                ))}
              </div>
              <p className="cakemanagement-category">{Array.isArray(cake.categories) ? cake.categories.join(', ') : ''}</p>
              <div className="cakemanagement-status">
                {cake.isAvailable ? (
                  <span className="cakemanagement-status-badge available">Available</span>
                ) : (
                  <span className="cakemanagement-status-badge unavailable">Unavailable</span>
                )}
                {cake.featured && (
                  <span className="cakemanagement-status-badge featured">Featured</span>
                )}
              </div>
              <div className="cakemanagement-card-actions">
                <button
                  className="cakemanagement-edit-btn"
                  onClick={() => handleEditCake(cake)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="cakemanagement-delete-btn"
                  onClick={() => handleDeleteCake(cake.id, cake.image)}
                >
                  <FaTrash /> Delete
                </button>
                <button
                  className="cakemanagement-edit-btn"
                  onClick={() => handleDuplicateCake(cake)}
                >
                  <FaCopy /> Duplicate
                </button>
              </div>
            </div>
          </div>
        )) : null}
      </div>

      {/* Modal for delete confirmation */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Delete Cake"
        message="Are you sure you want to delete this cake? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, cakeId: null, imageUrl: null })}
      />
    </div>
  );
};

export default CakeManagement; 
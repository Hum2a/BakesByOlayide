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
import EditForm from './forms/EditForm';

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
  const [cakeImages, setCakeImages] = useState([]);
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
    relatedProducts: [],
    quantities: [],
    occasions: [],
    toppers: [],
    decorationStyles: [],
    addOns: [],
    flavours: [],
    maxQuantity: ''
  });

  const [newSize, setNewSize] = useState({
    size: '',
    price: '',
    servingSize: ''
  });

  const [newShape, setNewShape] = useState({ name: '', price: '' });
  const [newFinish, setNewFinish] = useState({ name: '', price: '' });

  const [confirmModal, setConfirmModal] = useState({ open: false, cakeId: null, imageUrl: null });

  const [categoryFilter, setCategoryFilter] = useState('All');

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
    const files = Array.from(e.target.files).slice(0, 5);
    setCakeImages(files);
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
    if (selectedCategory === category && showNewCakeForm) {
      setShowNewCakeForm(false);
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      setShowNewCakeForm(true);
    }
    setEditingCake(null);
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
          quantities: newCake.quantities || [],
          description: newCake.description,
          ingredients: newCake.ingredients,
          occasions: newCake.occasions || [],
          toppers: newCake.toppers || [],
          decorationStyles: newCake.decorationStyles || [],
          addOns: newCake.addOns || [],
          relatedProducts: newCake.relatedProducts || [],
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
      let imageUrls = [];

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

      if (cakeImages && cakeImages.length > 0) {
        for (let i = 0; i < cakeImages.length; i++) {
          const img = cakeImages[i];
          if (img.size > 5 * 1024 * 1024) {
            throw new Error('Each image must be less than 5MB');
          }
          if (!img.type.startsWith('image/')) {
            throw new Error('All files must be images');
          }
          const storageRef = ref(storage, `cakes/${img.name}_${Date.now()}_${i}`);
          await uploadBytes(storageRef, img);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      if (imageUrls.length > 0) {
        newCake.images = imageUrls;
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
    // Ensure images is always an array of up to 5 images
    let imagesArr = [];
    if (Array.isArray(cake.images) && cake.images.length > 0) {
      imagesArr = [...cake.images].slice(0, 5);
    } else if (cake.image) {
      imagesArr = [cake.image];
    }
    while (imagesArr.length < 5) imagesArr.push('');
    setEditingCake(cake);
    setNewCake({ ...cake, images: imagesArr, relatedProducts: cake.relatedProducts || [] });
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
    setCakeImages([]);
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
      relatedProducts: [],
      quantities: [],
      occasions: [],
      toppers: [],
      decorationStyles: [],
      addOns: [],
      flavours: [],
      maxQuantity: ''
    });
  };

  const renderFormByCategory = () => {
    if (editingCake) {
      return (
        <EditForm
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

  // Get all unique categories from cakes
  const allCategories = Array.from(new Set((cakes || []).flatMap(cake => cake.categories || [])));

  // Filter cakes by selected category
  const filteredCakes = categoryFilter === 'All'
    ? cakes
    : (cakes || []).filter(cake => (cake.categories || []).includes(categoryFilter));

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
        {/* Category Filter UI */}
        <div className="cakemanagement-category-filter">
          <label>Filter by Category: </label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="All">All</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="cakemanagement-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              className={`cakemanagement-tab-btn${selectedCategory === tab.key && showNewCakeForm ? ' active' : ''}`}
              onClick={() => handleCategorySelect(tab.key)}
            >
              {tab.label}
            </button>
          ))}
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
                  <label>Cake Images (up to 5)</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[0,1,2,3,4].map(idx => {
                      const imgUrl = (Array.isArray(newCake.images) ? newCake.images[idx] : undefined) || (editingCake && Array.isArray(editingCake.images) ? editingCake.images[idx] : undefined) || '';
                      return (
                        <div key={idx} style={{ width: 110, height: 110, border: '1.5px dashed #ccc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#fafafa' }}>
                          {imgUrl ? (
                            <>
                              <img src={imgUrl} alt={`Cake ${idx+1}`} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6, objectFit: 'cover' }} />
                              <button
                                type="button"
                                className="cakemanagement-remove-btn"
                                style={{ position: 'absolute', top: 2, right: 2, zIndex: 2, background: '#fff', borderRadius: '50%' }}
                                onClick={() => {
                                  const updated = Array.isArray(newCake.images) ? [...newCake.images] : [];
                                  updated[idx] = '';
                                  setNewCake({ ...newCake, images: updated });
                                }}
                              >
                                <FaTimes />
                              </button>
                            </>
                          ) : (
                            <label style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#bbb' }}>
                              <FaPlus size={22} />
                              <span style={{ fontSize: 12 }}>Add Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) {
                                    setError('Each image must be less than 5MB');
                                    return;
                                  }
                                  if (!file.type.startsWith('image/')) {
                                    setError('All files must be images');
                                    return;
                                  }
                                  setLoading(true);
                                  try {
                                    const storageRef = ref(storage, `cakes/${file.name}_${Date.now()}_${idx}`);
                                    await uploadBytes(storageRef, file);
                                    const url = await getDownloadURL(storageRef);
                                    let updated = Array.isArray(newCake.images) ? [...newCake.images] : [];
                                    while (updated.length < 5) updated.push('');
                                    updated[idx] = url;
                                    setNewCake({ ...newCake, images: updated });
                                  } catch (err) {
                                    setError('Failed to upload image');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.9em', color: '#888', marginTop: 6 }}>You can upload up to 5 images. Click an image to remove or replace it.</p>
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
        {Array.isArray(filteredCakes) ? filteredCakes.map((cake) => (
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
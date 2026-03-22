import React, { useState, useEffect, useMemo } from 'react';
import { db, storage, auth } from '../../../firebase/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCopy, FaSearch, FaUndo } from 'react-icons/fa';
import '../../styles/CakeManagement.css';
import ConfirmModal from './ConfirmModal';
import CupcakeForm from './forms/CupcakeForm';
import BentocakeForm from './forms/BentocakeForm';
import BrowniesForm from './forms/BrowniesForm';
import CookiesForm from './forms/CookiesForm';
import RegularForm from './forms/RegularForm';
import { hasStaffAccess } from '../../../utils/staffAccess';

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
  /** null = permission check in progress; true/false after Firestore read */
  const [cakeMgmtAccess, setCakeMgmtAccess] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [imageWarningModal, setImageWarningModal] = useState({ open: false, message: '' });
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
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [seasonalFilter, setSeasonalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const allowed = hasStaffAccess(userData);
            setCakeMgmtAccess(allowed);
            setDebugInfo(`User ${user.uid} cake admin access: ${allowed ? 'granted' : 'denied'}`);
          } else {
            setCakeMgmtAccess(false);
            setDebugInfo(`User document not found for ${user.uid}`);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setError('Failed to verify admin status');
          setCakeMgmtAccess(false);
          setDebugInfo(`Error checking admin status: ${error.message}`);
        }
      } else {
        setCakeMgmtAccess(false);
        setDebugInfo('No authenticated user');
      }
    };
    checkAdminStatus();
  }, []);

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
      // Set the category automatically for specific form types
      if (category !== 'Regular Cakes') {
        setNewCake(prev => ({
          ...prev,
          categories: [category]
        }));
      }
    }
    setEditingCake(null);
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
          allergens: newCake.allergens,
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
          sizes: newCake.sizes,
          description: newCake.description,
          ingredients: newCake.ingredients,
          allergens: newCake.allergens,
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
          allergens: newCake.allergens,
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
          allergens: newCake.allergens,
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
      if (!hasStaffAccess(userData)) {
        throw new Error('User does not have permission to manage cakes');
      }

      // Handle image uploads
      if (cakeImages && cakeImages.length > 0) {
        for (let i = 0; i < cakeImages.length; i++) {
          const img = cakeImages[i];
          if (!img) continue; // Skip if no image

          try {
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
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
          }
        }
      }

      // Ensure category is set
      if (!newCake.categories || newCake.categories.length === 0) {
        throw new Error('Category must be selected');
      }

      const cleanedCake = getCleanedCakeData();

      // Handle image fields
      if (imageUrls.length > 0) {
        cleanedCake.image = imageUrls[0];
        cleanedCake.images = imageUrls;
      } else if (editingCake && editingCake.image) {
        cleanedCake.image = editingCake.image;
        cleanedCake.images = editingCake.images || [editingCake.image];
      } else if (Array.isArray(newCake.images) && newCake.images.filter(Boolean).length > 0) {
        // Use images already present in the UI (for new cakes)
        const validImages = newCake.images.filter(Boolean);
        cleanedCake.image = validImages[0];
        cleanedCake.images = validImages;
      } else {
        throw new Error('At least one image is required');
      }

      if (editingCake) {
        await updateDoc(doc(db, 'cakes', editingCake.id), cleanedCake);
      } else {
        await addDoc(collection(db, 'cakes'), cleanedCake);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error in handleCakeSubmit:', error);
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
    // Set selectedCategory to the main category of the cake
    const mainCategory = Array.isArray(cake.categories) && cake.categories.length > 0 ? cake.categories[0] : null;
    setSelectedCategory(mainCategory);
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
    // Use editingCake's main category if editing, otherwise selectedCategory
    const category = editingCake && Array.isArray(editingCake.categories) && editingCake.categories.length > 0
      ? editingCake.categories[0]
      : selectedCategory;
    if (editingCake) {
      switch (category) {
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
    }
    // Not editing, use selectedCategory as before
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

  const categoryOptions = useMemo(() => {
    const fromData = Array.from(
      new Set((cakes || []).flatMap(cake => cake.categories || []).filter(Boolean))
    );
    const merged = new Set([...FIXED_CATEGORIES, ...fromData, 'Regular Cakes']);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [cakes]);

  const filteredCakes = useMemo(() => {
    const searchBlob = (cake) => {
      const sizeBits = (Array.isArray(cake.sizes) ? cake.sizes : []).flatMap(s => [
        s.size,
        s.servingSize,
        s.price != null ? String(s.price) : '',
      ]);
      const parts = [
        cake.name,
        cake.description,
        ...(cake.categories || []),
        cake.id,
        ...(cake.flavours || []),
        ...(Array.isArray(cake.ingredients) ? cake.ingredients : []),
        ...(cake.occasions || []),
        ...(cake.customizationOptions || []),
        ...sizeBits,
      ];
      return parts.filter(Boolean).join(' ').toLowerCase();
    };

    let list = [...(cakes || [])];

    if (categoryFilter !== 'All') {
      list = list.filter(cake => (cake.categories || []).includes(categoryFilter));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(cake => searchBlob(cake).includes(q));
    }

    if (availabilityFilter === 'available') {
      list = list.filter(c => c.isAvailable !== false);
    } else if (availabilityFilter === 'unavailable') {
      list = list.filter(c => c.isAvailable === false);
    }

    if (featuredFilter === 'featured') {
      list = list.filter(c => c.featured);
    } else if (featuredFilter === 'not-featured') {
      list = list.filter(c => !c.featured);
    }

    if (seasonalFilter === 'seasonal') {
      list = list.filter(c => c.isSeasonal);
    } else if (seasonalFilter === 'not-seasonal') {
      list = list.filter(c => !c.isSeasonal);
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
        break;
      case 'updated-desc':
        sorted.sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
        break;
      case 'created-desc':
        sorted.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
        break;
      case 'name-asc':
      default:
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
        break;
    }

    return sorted;
  }, [
    cakes,
    categoryFilter,
    searchQuery,
    availabilityFilter,
    featuredFilter,
    seasonalFilter,
    sortBy,
  ]);

  const totalCakeCount = (cakes || []).length;
  const hasActiveFilters =
    categoryFilter !== 'All' ||
    searchQuery.trim() !== '' ||
    availabilityFilter !== 'all' ||
    featuredFilter !== 'all' ||
    seasonalFilter !== 'all' ||
    sortBy !== 'name-asc';

  const clearAllFilters = () => {
    setCategoryFilter('All');
    setSearchQuery('');
    setAvailabilityFilter('all');
    setFeaturedFilter('all');
    setSeasonalFilter('all');
    setSortBy('name-asc');
  };

  if (cakeMgmtAccess === null) {
    return (
      <div className="cakemanagement-loading"></div>
    );
  }

  if (!cakeMgmtAccess) {
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
        <div className="cakemanagement-header-top">
          <h2>Cake Management</h2>
          <p className="cakemanagement-results-count" aria-live="polite">
            Showing <strong>{filteredCakes.length}</strong> of <strong>{totalCakeCount}</strong> cakes
            {hasActiveFilters && filteredCakes.length !== totalCakeCount && ' (filtered)'}
          </p>
        </div>

        <div className="cakemanagement-filters-toolbar" role="search">
          <div className="cakemanagement-filter-search">
            <label htmlFor="cakemanagement-search" className="cakemanagement-sr-only">Search cakes</label>
            <FaSearch className="cakemanagement-filter-search-icon" aria-hidden />
            <input
              id="cakemanagement-search"
              type="search"
              className="cakemanagement-filter-search-input"
              placeholder="Search name, description, categories, ID, flavours…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="cakemanagement-filter-group">
            <label htmlFor="cakemanagement-filter-category">Category</label>
            <select
              id="cakemanagement-filter-category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="cakemanagement-filter-group">
            <label htmlFor="cakemanagement-filter-availability">Availability</label>
            <select
              id="cakemanagement-filter-availability"
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="available">Available only</option>
              <option value="unavailable">Unavailable only</option>
            </select>
          </div>

          <div className="cakemanagement-filter-group">
            <label htmlFor="cakemanagement-filter-featured">Featured</label>
            <select
              id="cakemanagement-filter-featured"
              value={featuredFilter}
              onChange={e => setFeaturedFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not featured</option>
            </select>
          </div>

          <div className="cakemanagement-filter-group">
            <label htmlFor="cakemanagement-filter-seasonal">Seasonal</label>
            <select
              id="cakemanagement-filter-seasonal"
              value={seasonalFilter}
              onChange={e => setSeasonalFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="seasonal">Seasonal</option>
              <option value="not-seasonal">Not seasonal</option>
            </select>
          </div>

          <div className="cakemanagement-filter-group">
            <label htmlFor="cakemanagement-filter-sort">Sort</label>
            <select
              id="cakemanagement-filter-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="updated-desc">Recently updated</option>
              <option value="created-desc">Recently created</option>
            </select>
          </div>

          <button
            type="button"
            className="cakemanagement-clear-filters-btn"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title="Reset search and filters"
          >
            <FaUndo aria-hidden /> Clear filters
          </button>
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
                  <label>Related Products (max 6)</label>
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
                              newCake.relatedProducts && newCake.relatedProducts.length >= 6
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
                                  
                                  // If trying to remove the first image, check if there are other valid images
                                  if (idx === 0) {
                                    const hasOtherImages = updated.some((img, i) => i > 0 && img);
                                    if (!hasOtherImages) {
                                      setImageWarningModal({
                                        open: true,
                                        message: 'Please add another image before removing the default image.'
                                      });
                                      return;
                                    }
                                  }
                                  
                                  updated[idx] = '';
                                  
                                  // If we're removing the first image (idx === 0), find the next available image to set as default
                                  if (idx === 0) {
                                    const nextValidImage = updated.find((img, i) => i > 0 && img);
                                    if (nextValidImage) {
                                      // Move the next valid image to the first position
                                      const nextValidIndex = updated.indexOf(nextValidImage);
                                      updated[0] = nextValidImage;
                                      updated[nextValidIndex] = '';
                                    }
                                  }
                                  
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
        {totalCakeCount > 0 && filteredCakes.length === 0 && (
          <div className="cakemanagement-empty-filters" role="status">
            <p>No cakes match your search or filters.</p>
            <button type="button" className="cakemanagement-clear-filters-btn inline" onClick={clearAllFilters}>
              Clear filters
            </button>
          </div>
        )}
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
                    <span>
                      {Array.isArray(cake.categories) && (
                        cake.categories.includes('Cupcakes') ? `${size.size} cupcakes` :
                        cake.categories.includes('Bento Cake with Cupcakes') ? `${size.size} cupcakes` :
                        cake.categories.includes('Brownies') ? `${size.size} pieces` :
                        cake.categories.includes('Cookies') ? `${size.size} cookies` :
                        `${size.size}"`
                      )}
                    </span>
                    <span>£{Number(size.price).toFixed(2)}</span>
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

      {/* Image warning modal */}
      <ConfirmModal
        isOpen={imageWarningModal.open}
        title="Warning"
        message={imageWarningModal.message}
        onConfirm={() => setImageWarningModal({ open: false, message: '' })}
        onCancel={() => setImageWarningModal({ open: false, message: '' })}
      />
    </div>
  );
};

export default CakeManagement; 
import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../../firebase/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import '../../styles/CakeManagement.css';

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

const CakeManagement = ({ cakes, onUpdate }) => {
  const [showNewCakeForm, setShowNewCakeForm] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [cakeImage, setCakeImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
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
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isNutFree: false,
      isDairyFree: false
    }
  });

  const [newSize, setNewSize] = useState({
    size: '',
    price: '',
    servingSize: ''
  });

  const [newShape, setNewShape] = useState({ name: '', price: '' });
  const [newFinish, setNewFinish] = useState({ name: '', price: '' });

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
        console.log('Uploading image to:', storageRef.fullPath);
        
        try {
          await uploadBytes(storageRef, cakeImage);
          imageUrl = await getDownloadURL(storageRef);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      }

      // Filter out empty strings from arrays
      const cleanedCake = {
        ...newCake,
        ingredients: newCake.ingredients.filter(item => item.trim() !== ''),
        allergens: newCake.allergens.filter(item => item.trim() !== ''),
        customizationOptions: newCake.customizationOptions.filter(item => item.trim() !== ''),
        sizes: newCake.sizes.map(size => ({
          ...size,
          price: parseFloat(size.price),
          servingSize: parseInt(size.servingSize, 10),
          image: imageUrl || (editingCake ? editingCake.image : null),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        servingSize: parseInt(newCake.servingSize, 10),
        image: imageUrl || (editingCake ? editingCake.image : null),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCake) {
        await updateDoc(doc(db, 'cakes', editingCake.id), cleanedCake);
      } else {
        await addDoc(collection(db, 'cakes'), cleanedCake);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving cake:', error);
      setError(error.message || 'Failed to save cake');
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCake = async (cakeId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this cake?')) return;

    try {
      setLoading(true);
      // Delete image from storage if it exists
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // Delete cake document
      await deleteDoc(doc(db, 'cakes', cakeId));
      // Notify parent component to refresh data
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
    setNewCake(cake);
    setShowNewCakeForm(true);
  };

  const resetForm = () => {
    setShowNewCakeForm(false);
    setEditingCake(null);
    setCakeImage(null);
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
      dietaryInfo: {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isNutFree: false,
        isDairyFree: false
      }
    });
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
        <button 
          className="cakemanagement-add-btn"
          onClick={() => setShowNewCakeForm(true)}
        >
          <FaPlus /> Add New Cake
        </button>
      </div>

      {error && (
        <div className="cakemanagement-error">
          {error}
        </div>
      )}

      {showNewCakeForm && (
        <div className="cakemanagement-form-container">
          <h3>{editingCake ? 'Edit Cake' : 'Add New Cake'}</h3>
          <form onSubmit={handleCakeSubmit} className="cakemanagement-form">
            <div className="cakemanagement-form-grid">
              <div className="cakemanagement-form-group">
                <label>Name*</label>
                <input
                  type="text"
                  value={newCake.name}
                  onChange={(e) => setNewCake({...newCake, name: e.target.value})}
                  required
                />
              </div>

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

              <div className="cakemanagement-form-group full-width">
                <label>Sizes and Prices*</label>
                <div className="cakemanagement-sizes">
                  {newCake.sizes.map((size, index) => (
                    <div key={index} className="cakemanagement-size-item">
                      <div className="cakemanagement-size-info">
                        <span className="cakemanagement-size-name">{size.size}"</span>
                        <span className="cakemanagement-size-price">£{size.price.toFixed(2)}</span>
                        <span className="cakemanagement-size-servings">({size.servingSize} servings)</span>
                      </div>
                      <button
                        type="button"
                        className="cakemanagement-remove-size-btn"
                        onClick={() => handleRemoveSize(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cakemanagement-add-size">
                  <div className="cakemanagement-size-inputs">
                    <input
                      type="number"
                      placeholder="Size (inches)"
                      value={newSize.size}
                      onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                      min="1"
                      step="0.5"
                    />
                    <input
                      type="number"
                      placeholder="Price (£)"
                      value={newSize.price}
                      onChange={(e) => setNewSize({...newSize, price: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Serving Size"
                      value={newSize.servingSize}
                      onChange={(e) => setNewSize({...newSize, servingSize: e.target.value})}
                      min="1"
                    />
                  </div>
                  <button
                    type="button"
                    className="cakemanagement-add-size-btn"
                    onClick={handleAddSize}
                  >
                    <FaPlus /> Add Size
                  </button>
                </div>
              </div>

              <div className="cakemanagement-form-group full-width">
                <label>Shapes*</label>
                <div className="cakemanagement-shapes">
                  {newCake.shapes.map((shape, index) => (
                    <div key={index} className="cakemanagement-shape-item">
                      <span>{shape.name}</span>
                      <span className="cakemanagement-shape-price">+£{shape.price.toFixed(2)}</span>
                      <button
                        type="button"
                        className="cakemanagement-remove-shape-btn"
                        onClick={() => handleRemoveShape(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cakemanagement-add-shape">
                  <input
                    type="text"
                    placeholder="Add shape (e.g. Round, Square, Heart)"
                    value={newShape.name}
                    onChange={(e) => setNewShape({ ...newShape, name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Price (£)"
                    min="0"
                    step="0.01"
                    value={newShape.price}
                    onChange={(e) => setNewShape({ ...newShape, price: e.target.value })}
                  />
                  <button
                    type="button"
                    className="cakemanagement-add-shape-btn"
                    onClick={handleAddShape}
                  >
                    <FaPlus /> Add Shape
                  </button>
                </div>
              </div>

              <div className="cakemanagement-form-group">
                <label>Dimensions*</label>
                <div className="cakemanagement-dimensions-inputs">
                  <input
                    type="number"
                    placeholder="Length"
                    value={newCake.dimensions.length}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      dimensions: { ...newCake.dimensions, length: e.target.value }
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={newCake.dimensions.width}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      dimensions: { ...newCake.dimensions, width: e.target.value }
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={newCake.dimensions.height}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      dimensions: { ...newCake.dimensions, height: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="cakemanagement-form-group">
                <label>Description*</label>
                <textarea
                  value={newCake.description}
                  onChange={(e) => setNewCake({...newCake, description: e.target.value})}
                  required
                  rows="3"
                />
              </div>

              <div className="cakemanagement-form-group full-width">
                <label>Ingredients*</label>
                <div className="cakemanagement-array-fields">
                  {newCake.ingredients.map((ingredient, index) => (
                    <div key={index} className="cakemanagement-array-field">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleArrayFieldChange('ingredients', index, e.target.value)}
                        placeholder="Enter ingredient"
                      />
                      <button
                        type="button"
                        onClick={() => handleArrayFieldRemove('ingredients', index)}
                        className="cakemanagement-remove-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleArrayFieldAdd('ingredients')}
                    className="cakemanagement-add-field-btn"
                  >
                    <FaPlus /> Add Ingredient
                  </button>
                </div>
              </div>

              <div className="cakemanagement-form-group full-width">
                <label>Allergens</label>
                <div className="cakemanagement-array-fields">
                  {newCake.allergens.map((allergen, index) => (
                    <div key={index} className="cakemanagement-array-field">
                      <input
                        type="text"
                        value={allergen}
                        onChange={(e) => handleArrayFieldChange('allergens', index, e.target.value)}
                        placeholder="Enter allergen"
                      />
                      <button
                        type="button"
                        onClick={() => handleArrayFieldRemove('allergens', index)}
                        className="cakemanagement-remove-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleArrayFieldAdd('allergens')}
                    className="cakemanagement-add-field-btn"
                  >
                    <FaPlus /> Add Allergen
                  </button>
                </div>
              </div>

              <div className="cakemanagement-form-group full-width">
                <label>Customization Options</label>
                <div className="cakemanagement-array-fields">
                  {newCake.customizationOptions.map((option, index) => (
                    <div key={index} className="cakemanagement-array-field">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleArrayFieldChange('customizationOptions', index, e.target.value)}
                        placeholder="Enter customization option"
                      />
                      <button
                        type="button"
                        onClick={() => handleArrayFieldRemove('customizationOptions', index)}
                        className="cakemanagement-remove-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleArrayFieldAdd('customizationOptions')}
                    className="cakemanagement-add-field-btn"
                  >
                    <FaPlus /> Add Option
                  </button>
                </div>
              </div>

              <div className="cakemanagement-form-group full-width">
                <label>Finishes</label>
                <div className="cakemanagement-finishes">
                  {newCake.finishes.map((finish, index) => (
                    <div key={index} className="cakemanagement-finish-item">
                      <span>{finish.name}</span>
                      <span className="cakemanagement-finish-price">+£{finish.price.toFixed(2)}</span>
                      <button
                        type="button"
                        className="cakemanagement-remove-finish-btn"
                        onClick={() => handleRemoveFinish(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cakemanagement-add-finish">
                  <input
                    type="text"
                    placeholder="Add finish (e.g. Buttercream, Fondant)"
                    value={newFinish.name}
                    onChange={(e) => setNewFinish({ ...newFinish, name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Price (£)"
                    min="0"
                    step="0.01"
                    value={newFinish.price}
                    onChange={(e) => setNewFinish({ ...newFinish, price: e.target.value })}
                  />
                  <button
                    type="button"
                    className="cakemanagement-add-finish-btn"
                    onClick={handleAddFinish}
                  >
                    <FaPlus /> Add Finish
                  </button>
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
      )}

      <div className="cakemanagement-grid">
        {cakes.map((cake) => (
          <div key={cake.id} className="cakemanagement-card">
            <div className="cakemanagement-card-image">
              <img src={cake.image} alt={cake.name} />
            </div>
            <div className="cakemanagement-card-content">
              <h3>{cake.name}</h3>
              <div className="cakemanagement-sizes-list">
                {cake.sizes.map((size, index) => (
                  <div key={index} className="cakemanagement-size-badge">
                    <span>{size.size}"</span>
                    <span>£{size.price.toFixed(2)}</span>
                    <span>({size.servingSize} servings)</span>
                  </div>
                ))}
              </div>
              <div className="cakemanagement-shapes-list">
                {cake.shapes && cake.shapes.map((shape, idx) => (
                  <span key={idx} className="cakemanagement-shape-badge">{shape.name} +£{shape.price.toFixed(2)}</span>
                ))}
              </div>
              <div className="cakemanagement-finishes-list">
                {cake.finishes && cake.finishes.map((finish, idx) => (
                  <span key={idx} className="cakemanagement-finish-badge">{finish.name} +£{finish.price.toFixed(2)}</span>
                ))}
              </div>
              <p className="cakemanagement-category">{cake.categories.join(', ')}</p>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CakeManagement; 
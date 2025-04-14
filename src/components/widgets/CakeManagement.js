import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../firebase/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import '../styles/CakeManagement.css';

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
    price: '',
    category: '',
    servingSize: '',
    dimensions: {
      size: '',
      shape: '',
      unit: 'inch'
    },
    preparationTime: {
      value: '',
      unit: 'hours'
    },
    ingredients: [''],
    allergens: [''],
    customizationOptions: [''],
    storageInstructions: '',
    shelfLife: '',
    isAvailable: true,
    featured: false,
    nutritionalInfo: {
      calories: '',
      fat: '',
      sugar: '',
      protein: ''
    },
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isNutFree: false,
      isDairyFree: false
    }
  });

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
        price: parseFloat(newCake.price),
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
      price: '',
      category: '',
      servingSize: '',
      dimensions: {
        size: '',
        shape: '',
        unit: 'inch'
      },
      preparationTime: {
        value: '',
        unit: 'hours'
      },
      ingredients: [''],
      allergens: [''],
      customizationOptions: [''],
      storageInstructions: '',
      shelfLife: '',
      isAvailable: true,
      featured: false,
      nutritionalInfo: {
        calories: '',
        fat: '',
        sugar: '',
        protein: ''
      },
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

              <div className="cakemanagement-form-group">
                <label>Category*</label>
                <select
                  value={newCake.category}
                  onChange={(e) => setNewCake({...newCake, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Classic">Classic</option>
                  <option value="Chocolate">Chocolate</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Specialty">Specialty</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </div>

              <div className="cakemanagement-form-group">
                <label>Price (£)*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCake.price}
                  onChange={(e) => setNewCake({...newCake, price: e.target.value})}
                  required
                />
              </div>

              <div className="cakemanagement-form-group">
                <label>Serving Size (number of people)*</label>
                <input
                  type="number"
                  min="1"
                  value={newCake.servingSize}
                  onChange={(e) => setNewCake({...newCake, servingSize: e.target.value})}
                  required
                />
              </div>

              <div className="cakemanagement-form-group">
                <label>Size*</label>
                <div className="cakemanagement-dimension-inputs">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newCake.dimensions.size}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      dimensions: { ...newCake.dimensions, size: e.target.value }
                    })}
                    required
                  />
                  <select
                    value={newCake.dimensions.unit}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      dimensions: { ...newCake.dimensions, unit: e.target.value }
                    })}
                  >
                    <option value="inch">inches</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>

              <div className="cakemanagement-form-group">
                <label>Shape*</label>
                <select
                  value={newCake.dimensions.shape}
                  onChange={(e) => setNewCake({
                    ...newCake,
                    dimensions: { ...newCake.dimensions, shape: e.target.value }
                  })}
                  required
                >
                  <option value="">Select Shape</option>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="heart">Heart</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="cakemanagement-form-group">
                <label>Preparation Time*</label>
                <div className="cakemanagement-prep-time-inputs">
                  <input
                    type="number"
                    min="1"
                    value={newCake.preparationTime.value}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      preparationTime: { ...newCake.preparationTime, value: e.target.value }
                    })}
                    required
                  />
                  <select
                    value={newCake.preparationTime.unit}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      preparationTime: { ...newCake.preparationTime, unit: e.target.value }
                    })}
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div className="cakemanagement-form-group full-width">
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

              <div className="cakemanagement-form-group">
                <label>Storage Instructions</label>
                <input
                  type="text"
                  value={newCake.storageInstructions}
                  onChange={(e) => setNewCake({...newCake, storageInstructions: e.target.value})}
                />
              </div>

              <div className="cakemanagement-form-group">
                <label>Shelf Life</label>
                <input
                  type="text"
                  value={newCake.shelfLife}
                  onChange={(e) => setNewCake({...newCake, shelfLife: e.target.value})}
                />
              </div>

              <div className="cakemanagement-form-group nutritional-info">
                <label>Nutritional Information (per slice)</label>
                <div className="cakemanagement-nutritional-grid">
                  <input
                    type="text"
                    placeholder="Calories"
                    value={newCake.nutritionalInfo.calories}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      nutritionalInfo: {...newCake.nutritionalInfo, calories: e.target.value}
                    })}
                  />
                  <input
                    type="text"
                    placeholder="Fat (g)"
                    value={newCake.nutritionalInfo.fat}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      nutritionalInfo: {...newCake.nutritionalInfo, fat: e.target.value}
                    })}
                  />
                  <input
                    type="text"
                    placeholder="Sugar (g)"
                    value={newCake.nutritionalInfo.sugar}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      nutritionalInfo: {...newCake.nutritionalInfo, sugar: e.target.value}
                    })}
                  />
                  <input
                    type="text"
                    placeholder="Protein (g)"
                    value={newCake.nutritionalInfo.protein}
                    onChange={(e) => setNewCake({
                      ...newCake,
                      nutritionalInfo: {...newCake.nutritionalInfo, protein: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="cakemanagement-form-group dietary-info">
                <label>Dietary Information</label>
                <div className="cakemanagement-dietary-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.dietaryInfo.isVegetarian}
                      onChange={(e) => setNewCake({
                        ...newCake,
                        dietaryInfo: {...newCake.dietaryInfo, isVegetarian: e.target.checked}
                      })}
                    />
                    Vegetarian
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.dietaryInfo.isVegan}
                      onChange={(e) => setNewCake({
                        ...newCake,
                        dietaryInfo: {...newCake.dietaryInfo, isVegan: e.target.checked}
                      })}
                    />
                    Vegan
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.dietaryInfo.isGlutenFree}
                      onChange={(e) => setNewCake({
                        ...newCake,
                        dietaryInfo: {...newCake.dietaryInfo, isGlutenFree: e.target.checked}
                      })}
                    />
                    Gluten Free
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.dietaryInfo.isNutFree}
                      onChange={(e) => setNewCake({
                        ...newCake,
                        dietaryInfo: {...newCake.dietaryInfo, isNutFree: e.target.checked}
                      })}
                    />
                    Nut Free
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newCake.dietaryInfo.isDairyFree}
                      onChange={(e) => setNewCake({
                        ...newCake,
                        dietaryInfo: {...newCake.dietaryInfo, isDairyFree: e.target.checked}
                      })}
                    />
                    Dairy Free
                  </label>
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
              <p className="cakemanagement-price">£{cake.price.toFixed(2)}</p>
              <p className="cakemanagement-category">{cake.category}</p>
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
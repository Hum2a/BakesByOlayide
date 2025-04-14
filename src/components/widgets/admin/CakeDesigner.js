import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import '../../styles/CakeDesigner.css';

const CakeDesigner = () => {
  const [options, setOptions] = useState({
    sizes: [],
    flavors: [],
    frostings: [],
    decorations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newOption, setNewOption] = useState({
    name: '',
    price: '',
    size: '',
    unit: '',
    servings: '',
    description: ''
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const optionsDoc = await getDoc(doc(db, 'cakeOptions', 'customizationOptions'));
      if (optionsDoc.exists()) {
        setOptions(optionsDoc.data());
      } else {
        // If document doesn't exist, create it with empty arrays
        await setDoc(doc(db, 'cakeOptions', 'customizationOptions'), {
          sizes: [],
          flavors: [],
          frostings: [],
          decorations: []
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching options:', err);
      setError('Failed to load customization options');
      setLoading(false);
    }
  };

  const handleAddOption = async () => {
    if (!editingCategory || (!newOption.name && !(editingCategory === 'sizes' && newOption.size && newOption.unit))) return;

    try {
      // For sizes, combine size and unit into the name
      const optionToAdd = { ...newOption };
      if (editingCategory === 'sizes' && newOption.size && newOption.unit) {
        optionToAdd.name = `${newOption.size} ${newOption.unit}`;
        optionToAdd.price = newOption.price ? parseFloat(newOption.price) : 0;
      } else {
        optionToAdd.price = newOption.price ? parseFloat(newOption.price) : 0;
      }

      const updatedOptions = {
        ...options,
        [editingCategory]: [...options[editingCategory], optionToAdd]
      };

      await setDoc(doc(db, 'cakeOptions', 'customizationOptions'), updatedOptions);
      setOptions(updatedOptions);
      setNewOption({
        name: '',
        price: '',
        size: '',
        unit: '',
        servings: '',
        description: ''
      });
    } catch (err) {
      console.error('Error adding option:', err);
      setError('Failed to add option');
    }
  };

  const handleRemoveOption = async (category, index) => {
    try {
      const updatedOptions = {
        ...options,
        [category]: options[category].filter((_, i) => i !== index)
      };

      await setDoc(doc(db, 'cakeOptions', 'customizationOptions'), updatedOptions);
      setOptions(updatedOptions);
    } catch (err) {
      console.error('Error removing option:', err);
      setError('Failed to remove option');
    }
  };

  const handleUpdateOption = async (category, index, field, value) => {
    try {
      const updatedOptions = {
        ...options,
        [category]: options[category].map((option, i) => {
          if (i === index) {
            const updatedOption = { ...option, [field]: value };
            // Update name when size or unit changes for size category
            if (category === 'sizes' && (field === 'size' || field === 'unit')) {
              updatedOption.name = `${updatedOption.size || ''} ${updatedOption.unit || ''}`.trim();
            }
            // Ensure price is a number
            if (field === 'price') {
              updatedOption.price = value === '' ? '' : parseFloat(value);
            }
            return updatedOption;
          }
          return option;
        })
      };

      await setDoc(doc(db, 'cakeOptions', 'customizationOptions'), updatedOptions);
      setOptions(updatedOptions);
    } catch (err) {
      console.error('Error updating option:', err);
      setError('Failed to update option');
    }
  };

  const renderOptionFields = (category, option, index) => {
    const baseFields = (
      <>
        {category === 'sizes' ? (
          <div className="cakedesigner-size-inputs">
            <input
              type="number"
              value={option.size || ''}
              onChange={(e) => handleUpdateOption(category, index, 'size', e.target.value)}
              className="cakedesigner-input cakedesigner-input-size"
              placeholder="Size"
              min="0"
              step="1"
            />
            <input
              type="text"
              value={option.unit || ''}
              onChange={(e) => handleUpdateOption(category, index, 'unit', e.target.value)}
              className="cakedesigner-input cakedesigner-input-unit"
              placeholder="Unit"
            />
          </div>
        ) : (
          <input
            type="text"
            value={option.name}
            onChange={(e) => handleUpdateOption(category, index, 'name', e.target.value)}
            className="cakedesigner-input"
            placeholder="Name"
          />
        )}
        <input
          type="number"
          value={option.price}
          onChange={(e) => handleUpdateOption(category, index, 'price', parseFloat(e.target.value))}
          className="cakedesigner-input"
          min="0"
          step="0.01"
          placeholder="Price"
        />
      </>
    );

    switch (category) {
      case 'sizes':
        return (
          <>
            {baseFields}
            <input
              type="text"
              value={option.servings || ''}
              onChange={(e) => handleUpdateOption(category, index, 'servings', e.target.value)}
              className="cakedesigner-input"
              placeholder="Servings"
            />
          </>
        );
      case 'flavors':
      case 'frostings':
      case 'decorations':
        return (
          <>
            {baseFields}
            <input
              type="text"
              value={option.description || ''}
              onChange={(e) => handleUpdateOption(category, index, 'description', e.target.value)}
              className="cakedesigner-input cakedesigner-input-description"
              placeholder="Description"
            />
          </>
        );
      default:
        return baseFields;
    }
  };

  const renderAddOptionFields = (category) => {
    const baseFields = (
      <>
        {category === 'sizes' ? (
          <div className="cakedesigner-size-inputs">
            <input
              type="number"
              placeholder="Size"
              value={editingCategory === category ? newOption.size : ''}
              onChange={(e) => setNewOption({ ...newOption, size: e.target.value })}
              className="cakedesigner-input cakedesigner-input-size"
              min="0"
              step="1"
              onFocus={() => setEditingCategory(category)}
            />
            <input
              type="text"
              placeholder="Unit"
              value={editingCategory === category ? newOption.unit : ''}
              onChange={(e) => setNewOption({ ...newOption, unit: e.target.value })}
              className="cakedesigner-input cakedesigner-input-unit"
              onFocus={() => setEditingCategory(category)}
            />
          </div>
        ) : (
          <input
            type="text"
            placeholder="Name"
            value={editingCategory === category ? newOption.name : ''}
            onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
            className="cakedesigner-input"
            onFocus={() => setEditingCategory(category)}
          />
        )}
        <input
          type="number"
          placeholder="Price"
          value={editingCategory === category ? newOption.price : ''}
          onChange={(e) => setNewOption({ ...newOption, price: parseFloat(e.target.value) })}
          className="cakedesigner-input"
          min="0"
          step="0.01"
          onFocus={() => setEditingCategory(category)}
        />
      </>
    );

    switch (category) {
      case 'sizes':
        return (
          <>
            {baseFields}
            <input
              type="text"
              placeholder="Servings"
              value={editingCategory === category ? newOption.servings : ''}
              onChange={(e) => setNewOption({ ...newOption, servings: e.target.value })}
              className="cakedesigner-input"
              onFocus={() => setEditingCategory(category)}
            />
          </>
        );
      case 'flavors':
      case 'frostings':
      case 'decorations':
        return (
          <>
            {baseFields}
            <input
              type="text"
              placeholder="Description"
              value={editingCategory === category ? newOption.description : ''}
              onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
              className="cakedesigner-input cakedesigner-input-description"
              onFocus={() => setEditingCategory(category)}
            />
          </>
        );
      default:
        return baseFields;
    }
  };

  if (loading) {
    return <div className="cakedesigner-loading">Loading customization options...</div>;
  }

  if (error) {
    return <div className="cakedesigner-error">{error}</div>;
  }

  return (
    <div className="cakedesigner-container">
      <h2>Cake Customization Options</h2>
      
      <div className="cakedesigner-categories">
        {Object.keys(options).map(category => (
          <div key={category} className="cakedesigner-category">
            <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            
            <div className="cakedesigner-options-list">
              {options[category].map((option, index) => (
                <div key={index} className="cakedesigner-option">
                  {renderOptionFields(category, option, index)}
                  <button
                    onClick={() => handleRemoveOption(category, index)}
                    className="cakedesigner-remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cakedesigner-add-option">
              {renderAddOptionFields(category)}
              <button
                onClick={handleAddOption}
                className="cakedesigner-add-btn"
                disabled={!newOption.name && !(category === 'sizes' && newOption.size && newOption.unit) || editingCategory !== category}
              >
                Add Option
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CakeDesigner; 
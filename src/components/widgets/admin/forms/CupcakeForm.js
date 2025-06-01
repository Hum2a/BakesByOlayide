import React, { useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

// Fixed categories from CakeManagement
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

const CupcakeForm = ({ newCake, setNewCake, newSize, setNewSize, handleAddSize, handleRemoveSize, cakes, editingCake }) => {
  // Ensure Cupcakes category is always selected
  useEffect(() => {
    if (!newCake.categories.includes('Cupcakes')) {
      setNewCake(prev => ({
        ...prev,
        categories: [...prev.categories, 'Cupcakes']
      }));
    }
  }, []);

  return (
    <>
      <div className="cakemanagement-form-group full-width">
        <label>Categories*</label>
        <div className="cakemanagement-categories">
          {FIXED_CATEGORIES.map((category) => (
            <label key={category} className="cakemanagement-category-checkbox">
              <input
                type="checkbox"
                checked={newCake.categories.includes(category)}
                disabled={category === 'Cupcakes'}
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
        <label>Batch Size and Prices*</label>
        <div className="cakemanagement-sizes">
          {newCake.sizes.map((size, index) => (
            <div key={index} className="cakemanagement-size-item">
              <div className="cakemanagement-size-info">
                <span className="cakemanagement-size-name">{size.size} cupcakes</span>
                <span className="cakemanagement-size-price">£{size.price.toFixed(2)}</span>
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
              placeholder="Batch Size (number of cupcakes)"
              value={newSize.size}
              onChange={(e) => setNewSize({...newSize, size: e.target.value})}
              min="1"
              step="1"
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
            <FaPlus /> Add Batch Size
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Max Quantity</label>
        <input
          type="number"
          min="1"
          value={newCake.maxQuantity || ''}
          onChange={e => setNewCake({ ...newCake, maxQuantity: e.target.value })}
          placeholder="Enter maximum quantity per order"
        />
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Description*</label>
        <textarea
          value={newCake.description}
          onChange={e => setNewCake({ ...newCake, description: e.target.value })}
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
                onChange={(e) => {
                  const newArray = [...newCake.ingredients];
                  newArray[index] = e.target.value;
                  setNewCake({ ...newCake, ingredients: newArray });
                }}
                placeholder="Enter ingredient"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, ingredients: newCake.ingredients.filter((_, i) => i !== index) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, ingredients: [...newCake.ingredients, ''] })}
          >
            <FaPlus /> Add Ingredient
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Allergens</label>
        <div className="cakemanagement-array-fields">
          {(newCake.allergens || []).map((allergen, index) => (
            <div key={index} className="cakemanagement-array-field">
              <input
                type="text"
                value={allergen}
                onChange={e => {
                  const newArray = [...newCake.allergens];
                  newArray[index] = e.target.value;
                  setNewCake({ ...newCake, allergens: newArray });
                }}
                placeholder="Enter allergen"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, allergens: newCake.allergens.filter((_, i) => i !== index) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, allergens: [...(newCake.allergens || []), ''] })}
          >
            <FaPlus /> Add Allergen
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Occasions</label>
        <div className="cakemanagement-array-fields">
          {(newCake.occasions || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={item.name}
                onChange={e => {
                  const updated = [...newCake.occasions];
                  updated[idx].name = e.target.value;
                  setNewCake({ ...newCake, occasions: updated });
                }}
                placeholder="e.g. Birthday, Wedding, Baby Shower"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={e => {
                  const updated = [...newCake.occasions];
                  updated[idx].price = e.target.value;
                  setNewCake({ ...newCake, occasions: updated });
                }}
                placeholder="Price (£)"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, occasions: newCake.occasions.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, occasions: [...(newCake.occasions || []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Occasion
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Toppers</label>
        <div className="cakemanagement-array-fields">
          {(newCake.toppers || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={item.name}
                onChange={e => {
                  const updated = [...newCake.toppers];
                  updated[idx].name = e.target.value;
                  setNewCake({ ...newCake, toppers: updated });
                }}
                placeholder="e.g. Happy Birthday, Custom Name, etc."
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={e => {
                  const updated = [...newCake.toppers];
                  updated[idx].price = e.target.value;
                  setNewCake({ ...newCake, toppers: updated });
                }}
                placeholder="Price (£)"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, toppers: newCake.toppers.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, toppers: [...(newCake.toppers || []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Topper
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Decoration Styles</label>
        <div className="cakemanagement-array-fields">
          {(newCake.decorationStyles || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={item.name}
                onChange={e => {
                  const updated = [...newCake.decorationStyles];
                  updated[idx].name = e.target.value;
                  setNewCake({ ...newCake, decorationStyles: updated });
                }}
                placeholder="e.g. Floral, Sprinkles, Themed, etc."
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={e => {
                  const updated = [...newCake.decorationStyles];
                  updated[idx].price = e.target.value;
                  setNewCake({ ...newCake, decorationStyles: updated });
                }}
                placeholder="Price (£)"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, decorationStyles: newCake.decorationStyles.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, decorationStyles: [...(newCake.decorationStyles || []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Decoration Style
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Add Ons</label>
        <div className="cakemanagement-array-fields">
          {(newCake.addOns || []).map((addOn, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={addOn.name}
                onChange={e => {
                  const updated = [...newCake.addOns];
                  updated[idx].name = e.target.value;
                  setNewCake({ ...newCake, addOns: updated });
                }}
                placeholder="Add on name (e.g. Candle, Card)"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={addOn.price}
                onChange={e => {
                  const updated = [...newCake.addOns];
                  updated[idx].price = e.target.value;
                  setNewCake({ ...newCake, addOns: updated });
                }}
                placeholder="Price (£)"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => {
                  setNewCake({ ...newCake, addOns: newCake.addOns.filter((_, i) => i !== idx) });
                }}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, addOns: [...(newCake.addOns || []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Add On
          </button>
        </div>
      </div>
    </>
  );
};

export default CupcakeForm; 
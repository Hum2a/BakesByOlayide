import React, { useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const BentocakeForm = ({ newCake, setNewCake }) => {
  // Set default size when component mounts
  useEffect(() => {
    if (!newCake.size) {
      setNewCake(prev => ({ ...prev, size: '6 inch' }));
    }
  }, []);

  return (
    <>
      <div className="cakemanagement-form-group full-width">
        <label>Cupcake Quantities (Sizes)</label>
        <div className="cakemanagement-sizes">
          {(Array.isArray(newCake.sizes) ? newCake.sizes : []).map((sizeObj, idx) => (
            <div key={idx} className="cakemanagement-size-item">
              <div className="cakemanagement-size-info">
                <span className="cakemanagement-size-name">{sizeObj.size} cupcakes</span>
                <span className="cakemanagement-size-price">£{sizeObj.price ? Number(sizeObj.price).toFixed(2) : '0.00'}</span>
              </div>
              <button
                type="button"
                className="cakemanagement-remove-size-btn"
                onClick={() => setNewCake({ ...newCake, sizes: newCake.sizes.filter((_, i) => i !== idx) })}
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
              placeholder="Number of cupcakes"
              min="1"
              value={newCake.newCupcakeSize || ''}
              onChange={e => setNewCake({ ...newCake, newCupcakeSize: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (£)"
              min="0"
              step="0.01"
              value={newCake.newCupcakePrice || ''}
              onChange={e => setNewCake({ ...newCake, newCupcakePrice: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="cakemanagement-add-size-btn"
            onClick={() => {
              if (!newCake.newCupcakeSize || !newCake.newCupcakePrice) return;
              setNewCake({
                ...newCake,
                sizes: [...(Array.isArray(newCake.sizes) ? newCake.sizes : []), { size: newCake.newCupcakeSize, price: newCake.newCupcakePrice }],
                newCupcakeSize: '',
                newCupcakePrice: ''
              });
            }}
          >
            <FaPlus /> Add Quantity
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Flavours</label>
        <div className="cakemanagement-array-fields">
          {(Array.isArray(newCake.flavours) ? newCake.flavours : []).map((flavour, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={flavour.name || ''}
                onChange={e => {
                  const updated = [...newCake.flavours];
                  updated[idx] = { ...updated[idx], name: e.target.value };
                  setNewCake({ ...newCake, flavours: updated });
                }}
                placeholder="e.g. Chocolate, Vanilla, Red Velvet"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={flavour.price || ''}
                onChange={e => {
                  const updated = [...newCake.flavours];
                  updated[idx] = { ...updated[idx], price: e.target.value };
                  setNewCake({ ...newCake, flavours: updated });
                }}
                placeholder="Price (£)"
                style={{ width: '100px', marginLeft: '8px' }}
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, flavours: newCake.flavours.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, flavours: [...(Array.isArray(newCake.flavours) ? newCake.flavours : []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Flavour
          </button>
        </div>
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
          {(Array.isArray(newCake.ingredients) ? newCake.ingredients : []).map((ingredient, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={ingredient}
                onChange={e => {
                  const updated = [...newCake.ingredients];
                  updated[idx] = e.target.value;
                  setNewCake({ ...newCake, ingredients: updated });
                }}
                placeholder="Enter ingredient"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, ingredients: newCake.ingredients.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, ingredients: [...(Array.isArray(newCake.ingredients) ? newCake.ingredients : []), ''] })}
          >
            <FaPlus /> Add Ingredient
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Allergens</label>
        <div className="cakemanagement-array-fields">
          {(Array.isArray(newCake.allergens) ? newCake.allergens : []).map((allergen, index) => (
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
            onClick={() => setNewCake({ ...newCake, allergens: [...(Array.isArray(newCake.allergens) ? newCake.allergens : []), ''] })}
          >
            <FaPlus /> Add Allergen
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Toppers</label>
        <div className="cakemanagement-array-fields">
          {(Array.isArray(newCake.toppers) ? newCake.toppers : []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="text"
                value={item.name || ''}
                onChange={e => {
                  const updated = [...newCake.toppers];
                  updated[idx] = { ...updated[idx], name: e.target.value };
                  setNewCake({ ...newCake, toppers: updated });
                }}
                placeholder="Topper name (e.g. Happy Birthday)"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price || ''}
                onChange={e => {
                  const updated = [...newCake.toppers];
                  updated[idx] = { ...updated[idx], price: e.target.value };
                  setNewCake({ ...newCake, toppers: updated });
                }}
                placeholder="Price (£)"
                style={{ width: '100px', marginLeft: '8px' }}
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
            onClick={() => setNewCake({ ...newCake, toppers: [...(Array.isArray(newCake.toppers) ? newCake.toppers : []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Topper
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Decoration Styles</label>
        <div className="cakemanagement-array-fields">
          {(Array.isArray(newCake.decorationStyles) ? newCake.decorationStyles : []).map((item, idx) => (
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
            onClick={() => setNewCake({ ...newCake, decorationStyles: [...(Array.isArray(newCake.decorationStyles) ? newCake.decorationStyles : []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Decoration Style
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Add Ons</label>
        <div className="cakemanagement-array-fields">
          {(Array.isArray(newCake.addOns) ? newCake.addOns : []).map((addOn, idx) => (
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
            onClick={() => setNewCake({ ...newCake, addOns: [...(Array.isArray(newCake.addOns) ? newCake.addOns : []), { name: '', price: '' }] })}
          >
            <FaPlus /> Add Add On
          </button>
        </div>
      </div>
    </>
  );
};

export default BentocakeForm; 
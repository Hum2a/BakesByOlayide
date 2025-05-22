import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const BrowniesForm = ({ newCake, setNewCake, newSize, setNewSize, handleAddSize, handleRemoveSize }) => {
  return (
    <>
      <div className="cakemanagement-form-group full-width">
        <label>Batch Size and Prices*</label>
        <div className="cakemanagement-sizes">
          {newCake.sizes.map((size, index) => (
            <div key={index} className="cakemanagement-size-item">
              <div className="cakemanagement-size-info">
                <span className="cakemanagement-size-name">{size.size} pieces</span>
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
              placeholder="Number of pieces"
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
        <label>Quantities</label>
        <div className="cakemanagement-array-fields">
          {(newCake.quantities || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input
                type="number"
                min="1"
                value={item.value}
                onChange={e => {
                  const updated = [...newCake.quantities];
                  updated[idx].value = e.target.value;
                  setNewCake({ ...newCake, quantities: updated });
                }}
                placeholder="Quantity per order"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={e => {
                  const updated = [...newCake.quantities];
                  updated[idx].price = e.target.value;
                  setNewCake({ ...newCake, quantities: updated });
                }}
                placeholder="Price (£)"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, quantities: newCake.quantities.filter((_, i) => i !== idx) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, quantities: [...(newCake.quantities || []), { value: '', price: '' }] })}
          >
            <FaPlus /> Add Quantity
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
          {(newCake.ingredients || []).map((ingredient, idx) => (
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
            onClick={() => setNewCake({ ...newCake, ingredients: [...(newCake.ingredients || []), ''] })}
          >
            <FaPlus /> Add Ingredient
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
                placeholder="Add on name (e.g. Extra Chocolate, Nuts)"
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

export default BrowniesForm; 
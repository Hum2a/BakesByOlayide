import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const RegularForm = ({
  newCake,
  setNewCake,
  newSize,
  setNewSize,
  handleAddSize,
  handleRemoveSize,
  handleAddShape,
  handleRemoveShape,
  newShape,
  setNewShape,
  handleAddFinish,
  handleRemoveFinish,
  newFinish,
  setNewFinish,
  cakes,
  editingCake
}) => {
  return (
    <>
      <div className="cakemanagement-form-group full-width">
        <label>Sizes and Prices*</label>
        <div className="cakemanagement-sizes">
          {(newCake.sizes || []).map((size, index) => (
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
          {(newCake.shapes || []).map((shape, index) => (
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
            value={newCake.dimensions?.length || ''}
            onChange={(e) => setNewCake({
              ...newCake,
              dimensions: { ...(newCake.dimensions || {}), length: e.target.value }
            })}
          />
          <input
            type="number"
            placeholder="Width"
            value={newCake.dimensions?.width || ''}
            onChange={(e) => setNewCake({
              ...newCake,
              dimensions: { ...(newCake.dimensions || {}), width: e.target.value }
            })}
          />
          <input
            type="number"
            placeholder="Height"
            value={newCake.dimensions?.height || ''}
            onChange={(e) => setNewCake({
              ...newCake,
              dimensions: { ...(newCake.dimensions || {}), height: e.target.value }
            })}
          />
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
          {(newCake.ingredients || []).map((ingredient, index) => (
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
                onChange={(e) => {
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
            onClick={() => setNewCake({ ...newCake, allergens: [...newCake.allergens, ''] })}
          >
            <FaPlus /> Add Allergen
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Customization Options</label>
        <div className="cakemanagement-array-fields">
          {(newCake.customizationOptions || []).map((option, index) => (
            <div key={index} className="cakemanagement-array-field">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newArray = [...newCake.customizationOptions];
                  newArray[index] = e.target.value;
                  setNewCake({ ...newCake, customizationOptions: newArray });
                }}
                placeholder="Enter customization option"
              />
              <button
                type="button"
                className="cakemanagement-remove-btn"
                onClick={() => setNewCake({ ...newCake, customizationOptions: newCake.customizationOptions.filter((_, i) => i !== index) })}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cakemanagement-add-field-btn"
            onClick={() => setNewCake({ ...newCake, customizationOptions: [...newCake.customizationOptions, ''] })}
          >
            <FaPlus /> Add Option
          </button>
        </div>
      </div>

      <div className="cakemanagement-form-group full-width">
        <label>Finishes</label>
        <div className="cakemanagement-finishes">
          {(newCake.finishes || []).map((finish, index) => (
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
    </>
  );
};

export default RegularForm; 
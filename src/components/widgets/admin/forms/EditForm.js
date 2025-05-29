import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const EditForm = ({
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
  cakes = [],
  editingCake
}) => {
  return (
    <>
      {/* General Info */}
      <div className="cakemanagement-form-group full-width">
        <label>Name*</label>
        <input
          type="text"
          value={newCake.name}
          onChange={e => setNewCake({ ...newCake, name: e.target.value })}
          required
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
        <label>Categories</label>
        <input
          type="text"
          value={(newCake.categories || []).join(', ')}
          onChange={e => setNewCake({ ...newCake, categories: e.target.value.split(',').map(s => s.trim()) })}
          placeholder="Comma separated categories"
        />
      </div>
      <div className="cakemanagement-form-group availability-options">
        <label>
          <input
            type="checkbox"
            checked={!!newCake.isAvailable}
            onChange={e => setNewCake({ ...newCake, isAvailable: e.target.checked })}
          />
          Available for Purchase
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!newCake.featured}
            onChange={e => setNewCake({ ...newCake, featured: e.target.checked })}
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
              onChange={() => setNewCake({ ...newCake, isSeasonal: false })}
            />
            Year Round
          </label>
          <label className="cakemanagement-radio-label">
            <input
              type="radio"
              name="availabilityPeriod"
              checked={!!newCake.isSeasonal}
              onChange={() => setNewCake({ ...newCake, isSeasonal: true })}
            />
            Seasonal
          </label>
        </div>
      </div>
      {/* Sizes */}
      <div className="cakemanagement-form-group full-width">
        <label>Sizes and Prices*</label>
        <div className="cakemanagement-sizes">
          {(newCake.sizes || []).map((size, index) => (
            <div key={index} className="cakemanagement-size-item">
              <div className="cakemanagement-size-info">
                <span className="cakemanagement-size-name">{size.size}</span>
                <span className="cakemanagement-size-price">£{size.price?.toFixed(2)}</span>
                {size.servingSize && <span className="cakemanagement-size-servings">({size.servingSize} servings)</span>}
              </div>
              <button type="button" className="cakemanagement-remove-size-btn" onClick={() => handleRemoveSize(index)}><FaTimes /></button>
            </div>
          ))}
        </div>
        <div className="cakemanagement-add-size">
          <div className="cakemanagement-size-inputs">
            <input type="number" placeholder="Size/Batch" value={newSize.size} onChange={e => setNewSize({ ...newSize, size: e.target.value })} min="1" />
            <input type="number" placeholder="Price (£)" value={newSize.price} onChange={e => setNewSize({ ...newSize, price: e.target.value })} min="0" step="0.01" />
            <input type="number" placeholder="Serving Size" value={newSize.servingSize} onChange={e => setNewSize({ ...newSize, servingSize: e.target.value })} min="1" />
          </div>
          <button type="button" className="cakemanagement-add-size-btn" onClick={handleAddSize}><FaPlus /> Add Size/Batch</button>
        </div>
      </div>
      {/* Max Quantity */}
      <div className="cakemanagement-form-group full-width">
        <label>Max Quantity</label>
        <input type="number" min="1" value={newCake.maxQuantity || ''} onChange={e => setNewCake({ ...newCake, maxQuantity: e.target.value })} placeholder="Enter maximum quantity per order" />
      </div>
      {/* Shapes */}
      <div className="cakemanagement-form-group full-width">
        <label>Shapes</label>
        <div className="cakemanagement-shapes">
          {(newCake.shapes || []).map((shape, index) => (
            <div key={index} className="cakemanagement-shape-item">
              <span>{shape.name}</span>
              <span className="cakemanagement-shape-price">+£{shape.price?.toFixed(2)}</span>
              <button type="button" className="cakemanagement-remove-shape-btn" onClick={() => handleRemoveShape(index)}><FaTimes /></button>
            </div>
          ))}
        </div>
        <div className="cakemanagement-add-shape">
          <input type="text" placeholder="Add shape (e.g. Round, Square, Heart)" value={newShape.name} onChange={e => setNewShape({ ...newShape, name: e.target.value })} />
          <input type="number" placeholder="Price (£)" min="0" step="0.01" value={newShape.price} onChange={e => setNewShape({ ...newShape, price: e.target.value })} />
          <button type="button" className="cakemanagement-add-shape-btn" onClick={handleAddShape}><FaPlus /> Add Shape</button>
        </div>
      </div>
      {/* Finishes */}
      <div className="cakemanagement-form-group full-width">
        <label>Finishes</label>
        <div className="cakemanagement-finishes">
          {(newCake.finishes || []).map((finish, index) => (
            <div key={index} className="cakemanagement-finish-item">
              <span>{finish.name}</span>
              <span className="cakemanagement-finish-price">+£{finish.price?.toFixed(2)}</span>
              <button type="button" className="cakemanagement-remove-finish-btn" onClick={() => handleRemoveFinish(index)}><FaTimes /></button>
            </div>
          ))}
        </div>
        <div className="cakemanagement-add-finish">
          <input type="text" placeholder="Add finish (e.g. Buttercream, Fondant)" value={newFinish.name} onChange={e => setNewFinish({ ...newFinish, name: e.target.value })} />
          <input type="number" placeholder="Price (£)" min="0" step="0.01" value={newFinish.price} onChange={e => setNewFinish({ ...newFinish, price: e.target.value })} />
          <button type="button" className="cakemanagement-add-finish-btn" onClick={handleAddFinish}><FaPlus /> Add Finish</button>
        </div>
      </div>
      {/* Dimensions */}
      <div className="cakemanagement-form-group">
        <label>Dimensions</label>
        <div className="cakemanagement-dimensions-inputs">
          <input type="number" placeholder="Length" value={newCake.dimensions?.length || ''} onChange={e => setNewCake({ ...newCake, dimensions: { ...(newCake.dimensions || {}), length: e.target.value } })} />
          <input type="number" placeholder="Width" value={newCake.dimensions?.width || ''} onChange={e => setNewCake({ ...newCake, dimensions: { ...(newCake.dimensions || {}), width: e.target.value } })} />
          <input type="number" placeholder="Height" value={newCake.dimensions?.height || ''} onChange={e => setNewCake({ ...newCake, dimensions: { ...(newCake.dimensions || {}), height: e.target.value } })} />
          <input type="text" placeholder="Unit" value={newCake.dimensions?.unit || ''} onChange={e => setNewCake({ ...newCake, dimensions: { ...(newCake.dimensions || {}), unit: e.target.value } })} />
        </div>
      </div>
      {/* Fillings */}
      <div className="cakemanagement-form-group full-width">
        <label>Fillings</label>
        <div className="cakemanagement-array-fields">
          {(newCake.fillings || []).map((filling, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={filling.name || ''} onChange={e => { const updated = [...newCake.fillings]; updated[idx] = { ...updated[idx], name: e.target.value }; setNewCake({ ...newCake, fillings: updated }); }} placeholder="Filling name" />
              <input type="number" min="0" step="0.01" value={filling.price || ''} onChange={e => { const updated = [...newCake.fillings]; updated[idx] = { ...updated[idx], price: e.target.value }; setNewCake({ ...newCake, fillings: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, fillings: newCake.fillings.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, fillings: [...(newCake.fillings || []), { name: '', price: '' }] })}><FaPlus /> Add Filling</button>
        </div>
      </div>
      {/* Flavours */}
      <div className="cakemanagement-form-group full-width">
        <label>Flavours</label>
        <div className="cakemanagement-array-fields">
          {(newCake.flavours || []).map((flavour, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={flavour.name || ''} onChange={e => { const updated = [...newCake.flavours]; updated[idx] = { ...updated[idx], name: e.target.value }; setNewCake({ ...newCake, flavours: updated }); }} placeholder="Flavour name" />
              <input type="number" min="0" step="0.01" value={flavour.price || ''} onChange={e => { const updated = [...newCake.flavours]; updated[idx] = { ...updated[idx], price: e.target.value }; setNewCake({ ...newCake, flavours: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, flavours: newCake.flavours.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, flavours: [...(newCake.flavours || []), { name: '', price: '' }] })}><FaPlus /> Add Flavour</button>
        </div>
      </div>
      {/* Occasions */}
      <div className="cakemanagement-form-group full-width">
        <label>Occasions</label>
        <div className="cakemanagement-array-fields">
          {(newCake.occasions || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={item.name || ''} onChange={e => { const updated = [...newCake.occasions]; updated[idx].name = e.target.value; setNewCake({ ...newCake, occasions: updated }); }} placeholder="Occasion name" />
              <input type="number" min="0" step="0.01" value={item.price || ''} onChange={e => { const updated = [...newCake.occasions]; updated[idx].price = e.target.value; setNewCake({ ...newCake, occasions: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, occasions: newCake.occasions.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, occasions: [...(newCake.occasions || []), { name: '', price: '' }] })}><FaPlus /> Add Occasion</button>
        </div>
      </div>
      {/* Toppers */}
      <div className="cakemanagement-form-group full-width">
        <label>Toppers</label>
        <div className="cakemanagement-array-fields">
          {(newCake.toppers || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={item.name || ''} onChange={e => { const updated = [...newCake.toppers]; updated[idx].name = e.target.value; setNewCake({ ...newCake, toppers: updated }); }} placeholder="Topper name" />
              <input type="number" min="0" step="0.01" value={item.price || ''} onChange={e => { const updated = [...newCake.toppers]; updated[idx].price = e.target.value; setNewCake({ ...newCake, toppers: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, toppers: newCake.toppers.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, toppers: [...(newCake.toppers || []), { name: '', price: '' }] })}><FaPlus /> Add Topper</button>
        </div>
      </div>
      {/* Decoration Styles */}
      <div className="cakemanagement-form-group full-width">
        <label>Decoration Styles</label>
        <div className="cakemanagement-array-fields">
          {(newCake.decorationStyles || []).map((item, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={item.name || ''} onChange={e => { const updated = [...newCake.decorationStyles]; updated[idx].name = e.target.value; setNewCake({ ...newCake, decorationStyles: updated }); }} placeholder="Style name" />
              <input type="number" min="0" step="0.01" value={item.price || ''} onChange={e => { const updated = [...newCake.decorationStyles]; updated[idx].price = e.target.value; setNewCake({ ...newCake, decorationStyles: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, decorationStyles: newCake.decorationStyles.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, decorationStyles: [...(newCake.decorationStyles || []), { name: '', price: '' }] })}><FaPlus /> Add Decoration Style</button>
        </div>
      </div>
      {/* Add Ons */}
      <div className="cakemanagement-form-group full-width">
        <label>Add Ons</label>
        <div className="cakemanagement-array-fields">
          {(newCake.addOns || []).map((addOn, idx) => (
            <div key={idx} className="cakemanagement-array-field">
              <input type="text" value={addOn.name} onChange={e => { const updated = [...newCake.addOns]; updated[idx].name = e.target.value; setNewCake({ ...newCake, addOns: updated }); }} placeholder="Add on name" />
              <input type="number" min="0" step="0.01" value={addOn.price} onChange={e => { const updated = [...newCake.addOns]; updated[idx].price = e.target.value; setNewCake({ ...newCake, addOns: updated }); }} placeholder="Price (£)" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, addOns: newCake.addOns.filter((_, i) => i !== idx) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, addOns: [...(newCake.addOns || []), { name: '', price: '' }] })}><FaPlus /> Add Add On</button>
        </div>
      </div>
      {/* Ingredients */}
      <div className="cakemanagement-form-group full-width">
        <label>Ingredients*</label>
        <div className="cakemanagement-array-fields">
          {(newCake.ingredients || []).map((ingredient, index) => (
            <div key={index} className="cakemanagement-array-field">
              <input type="text" value={ingredient} onChange={e => { const newArray = [...newCake.ingredients]; newArray[index] = e.target.value; setNewCake({ ...newCake, ingredients: newArray }); }} placeholder="Enter ingredient" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, ingredients: newCake.ingredients.filter((_, i) => i !== index) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, ingredients: [...newCake.ingredients, ''] })}><FaPlus /> Add Ingredient</button>
        </div>
      </div>
      {/* Allergens */}
      <div className="cakemanagement-form-group full-width">
        <label>Allergens</label>
        <div className="cakemanagement-array-fields">
          {(newCake.allergens || []).map((allergen, index) => (
            <div key={index} className="cakemanagement-array-field">
              <input type="text" value={allergen} onChange={e => { const newArray = [...newCake.allergens]; newArray[index] = e.target.value; setNewCake({ ...newCake, allergens: newArray }); }} placeholder="Enter allergen" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, allergens: newCake.allergens.filter((_, i) => i !== index) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, allergens: [...newCake.allergens, ''] })}><FaPlus /> Add Allergen</button>
        </div>
      </div>
      {/* Customization Options */}
      <div className="cakemanagement-form-group full-width">
        <label>Customization Options</label>
        <div className="cakemanagement-array-fields">
          {(newCake.customizationOptions || []).map((option, index) => (
            <div key={index} className="cakemanagement-array-field">
              <input type="text" value={option} onChange={e => { const newArray = [...newCake.customizationOptions]; newArray[index] = e.target.value; setNewCake({ ...newCake, customizationOptions: newArray }); }} placeholder="Enter customization option" />
              <button type="button" className="cakemanagement-remove-btn" onClick={() => setNewCake({ ...newCake, customizationOptions: newCake.customizationOptions.filter((_, i) => i !== index) })}><FaTimes /></button>
            </div>
          ))}
          <button type="button" className="cakemanagement-add-field-btn" onClick={() => setNewCake({ ...newCake, customizationOptions: [...newCake.customizationOptions, ''] })}><FaPlus /> Add Option</button>
        </div>
      </div>
      {/* Related Products */}
      <div className="cakemanagement-form-group full-width">
        <label>Related Products (max 3)</label>
        <div className="cakemanagement-related-products-list">
          {cakes.filter(c => !editingCake || c.id !== editingCake.id).map(cakeOption => (
            <label key={cakeOption.id} className="cakemanagement-related-checkbox">
              <input
                type="checkbox"
                checked={newCake.relatedProducts && newCake.relatedProducts.includes(cakeOption.id)}
                disabled={!(newCake.relatedProducts && newCake.relatedProducts.includes(cakeOption.id)) && newCake.relatedProducts && newCake.relatedProducts.length >= 3}
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
      {/* Dietary Info */}
      <div className="cakemanagement-form-group full-width">
        <label>Dietary Info</label>
        <div className="cakemanagement-dietary-info">
          <label><input type="checkbox" checked={!!newCake.dietaryInfo?.isVegetarian} onChange={e => setNewCake({ ...newCake, dietaryInfo: { ...(newCake.dietaryInfo || {}), isVegetarian: e.target.checked } })} /> Vegetarian</label>
          <label><input type="checkbox" checked={!!newCake.dietaryInfo?.isVegan} onChange={e => setNewCake({ ...newCake, dietaryInfo: { ...(newCake.dietaryInfo || {}), isVegan: e.target.checked } })} /> Vegan</label>
          <label><input type="checkbox" checked={!!newCake.dietaryInfo?.isGlutenFree} onChange={e => setNewCake({ ...newCake, dietaryInfo: { ...(newCake.dietaryInfo || {}), isGlutenFree: e.target.checked } })} /> Gluten Free</label>
          <label><input type="checkbox" checked={!!newCake.dietaryInfo?.isNutFree} onChange={e => setNewCake({ ...newCake, dietaryInfo: { ...(newCake.dietaryInfo || {}), isNutFree: e.target.checked } })} /> Nut Free</label>
          <label><input type="checkbox" checked={!!newCake.dietaryInfo?.isDairyFree} onChange={e => setNewCake({ ...newCake, dietaryInfo: { ...(newCake.dietaryInfo || {}), isDairyFree: e.target.checked } })} /> Dairy Free</label>
        </div>
      </div>
    </>
  );
};

export default EditForm;

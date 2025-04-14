import React from 'react';
import '../styles/CakePreview.css';

const CakePreview = ({ selections }) => {
  const getFrostingColor = (frosting) => {
    const colors = {
      'Vanilla': '#f5f5dc',
      'Chocolate': '#8B4513',
      'Strawberry': '#FFB6C1',
      'Cream Cheese': '#FFE4C4',
      'Buttercream': '#FFF8DC',
      'default': '#f5f5dc'
    };
    return colors[frosting] || colors.default;
  };

  const getFlavorColor = (flavor) => {
    const colors = {
      'Vanilla': '#FFF8DC',
      'Chocolate': '#5C4033',
      'Red Velvet': '#8B0000',
      'Carrot': '#FFA07A',
      'Lemon': '#FFFACD',
      'default': '#FFF8DC'
    };
    return colors[flavor] || colors.default;
  };

  return (
    <div className="cake-preview-container">
      <div className="cake-preview">
        {/* Cake Base */}
        <div 
          className="cake-base"
          style={{ 
            backgroundColor: selections.flavor ? getFlavorColor(selections.flavor) : '#FFF8DC',
            height: selections.size ? 
              (selections.size.includes('Small') ? '100px' : 
               selections.size.includes('Medium') ? '150px' : 
               selections.size.includes('Large') ? '200px' : '100px') : '100px'
          }}
        >
          {/* Frosting */}
          <div 
            className="cake-frosting"
            style={{ 
              backgroundColor: selections.frosting ? getFrostingColor(selections.frosting) : '#f5f5dc',
              height: '20px'
            }}
          />
          
          {/* Decorations */}
          {selections.decorations && selections.decorations.length > 0 && (
            <div className="cake-decorations">
              {selections.decorations.map((decoration, index) => (
                <div 
                  key={index} 
                  className={`decoration decoration-${index % 3}`}
                  style={{ 
                    backgroundColor: decoration.includes('Sprinkles') ? '#FF69B4' :
                                   decoration.includes('Fruit') ? '#FF6347' :
                                   decoration.includes('Chocolate') ? '#8B4513' : '#FFD700'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CakePreview; 
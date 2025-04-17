import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import '../styles/CakePreview3D.css';

function CakeModel({ selections }) {
  const group = useRef();
  const [hovered, setHovered] = useState(false);

  // Rotate the cake slightly
  useFrame((state) => {
    group.current.rotation.y += 0.005;
  });

  const getFlavorColor = (flavor) => {
    const colors = {
      'Vanilla': '#FFF8DC',
      'Chocolate': '#5C4033', 
      'Red Velvet': '#8B0000',
      'Carrot': '#FFA07A',
      'Lemon': '#FFFACD',
      'Strawberry': '#FFB6C1',
      'Blueberry': '#4169E1',
      'Orange': '#FFA500',
      'Raspberry': '#E30B5D',
      'Coconut': '#FFFFFF',
      'Almond': '#FFEBCD',
      'Hazelnut': '#B8860B',
      'Pistachio': '#93C572',
      'Coffee': '#6F4E37',
      'Marble': '#F5F5F5',
      'Funfetti': '#FFFFFF',
      'Banana': '#FFE135',
      'Pumpkin Spice': '#E68A2E',
      'Cookies and Cream': '#E8E8E8',
      'Mint Chocolate': '#98FF98',
      'Peanut Butter': '#D2691E',
      'default': '#FFF8DC'
    };
    return colors[flavor] || colors.default;
  };

  const getFrostingColor = (frosting) => {
    const colors = {
      'Vanilla Buttercream': '#f5f5dc',
      'Chocolate': '#8B4513', 
      'Strawberry': '#FFB6C1',
      'Cream Cheese': '#FFE4C4',
      'Lemon': '#FFF8DC',
      'Caramel': '#D4A017',
      'Coffee': '#6F4E37',
      'Mint': '#98FF98',
      'Orange': '#FFA500',
      'Raspberry': '#E30B5D',
      'Blueberry': '#4169E1',
      'Peanut Butter': '#D2691E',
      'Cookies and Cream': '#E8E8E8',
      'Maple': '#C45D1B',
      'Coconut': '#FFFFFF',
      'Almond': '#FFEBCD',
      'Hazelnut': '#B8860B',
      'Pistachio': '#93C572',
      'Mocha': '#6F4E37',
      'default': '#f5f5dc'
    };
    return colors[frosting] || colors.default;
  };

  const getCakeSize = (size) => {
    // Extract the number from the size string (e.g., "6 inch" -> 6)
    const sizeNumber = parseInt(size);
    if (!sizeNumber) return 1;
    
    // Scale the cake size relative to the inch measurement
    // Using 6 inch as the base size (scale 1)
    return sizeNumber / 6;
  };

  const getCakeHeight = (size) => {
    // Make the height proportional to the diameter but not as extreme
    const sizeNumber = parseInt(size);
    if (!sizeNumber) return 0.5;
    return 0.5 + (sizeNumber / 12); // Subtle height increase with size
  };

  const getTierCount = (size) => {
    const sizeNumber = parseInt(size);
    if (!sizeNumber) return 1;
    if (sizeNumber <= 6) return 1;
    if (sizeNumber <= 10) return 2;
    return 3;
  };

  const getTierSizes = (size) => {
    const tierCount = getTierCount(size);
    const baseSize = getCakeSize(size);
    const sizes = [];
    
    for (let i = 0; i < tierCount; i++) {
      sizes.push(baseSize * (1 - (i * 0.2))); // Each tier is 20% smaller than the one below
    }
    
    return sizes;
  };

  const createFrostingPattern = (radius, height, segments = 32) => {
    const vertices = [];
    const indices = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height + Math.sin(angle * 4) * 0.05; // Wavy pattern
      vertices.push(x, y, z);
    }
    
    for (let i = 0; i < segments; i++) {
      indices.push(i, (i + 1) % segments, segments);
    }
    
    return { vertices, indices };
  };

  const renderCakeTiers = () => {
    const tierSizes = getTierSizes(selections.size);
    const tierHeight = getCakeHeight(selections.size) / tierSizes.length;
    const tiers = [];

    tierSizes.forEach((size, index) => {
      const yOffset = index * tierHeight;
      
      // Cake layer
      tiers.push(
        <mesh key={`cake-${index}`} position={[0, yOffset, 0]}>
          <cylinderGeometry 
            args={[size, size, tierHeight, 32]} 
          />
          <meshStandardMaterial 
            color={selections.flavor ? getFlavorColor(selections.flavor) : '#FFF8DC'}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      );

      // Frosting layer
      const frostingPattern = createFrostingPattern(size + 0.1, yOffset + tierHeight/2);
      tiers.push(
        <mesh key={`frosting-${index}`} position={[0, yOffset + tierHeight/2, 0]}>
          <cylinderGeometry 
            args={[size + 0.1, size + 0.1, 0.1, 32]} 
          />
          <meshStandardMaterial 
            color={selections.frosting ? getFrostingColor(selections.frosting) : '#f5f5dc'}
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>
      );

      // Decorative border
      tiers.push(
        <mesh key={`border-${index}`} position={[0, yOffset + tierHeight/2 + 0.05, 0]}>
          <torusGeometry 
            args={[size + 0.1, 0.05, 16, 32]} 
          />
          <meshStandardMaterial 
            color={selections.frosting ? getFrostingColor(selections.frosting) : '#f5f5dc'}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
      );
    });

    return tiers;
  };

  const renderDecorations = () => {
    if (!selections.decorations || selections.decorations.length === 0) return null;

    const tierSizes = getTierSizes(selections.size);
    const tierHeight = getCakeHeight(selections.size) / tierSizes.length;
    const decorations = [];

    selections.decorations.forEach((decoration, index) => {
      const tierIndex = Math.floor(index / (selections.decorations.length / tierSizes.length));
      const tierSize = tierSizes[tierIndex];
      const yOffset = tierIndex * tierHeight;
      
      const totalDecorations = Math.ceil(selections.decorations.length / tierSizes.length);
      const angle = (index % totalDecorations) / totalDecorations * Math.PI * 2;
      const radius = tierSize * 0.7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      let decorationGeometry;
      let decorationScale = 0.1 * tierSize * 0.3;

      if (decoration.includes('Sprinkles')) {
        decorationGeometry = <sphereGeometry args={[decorationScale, 8, 8]} />;
      } else if (decoration.includes('Fruit')) {
        decorationGeometry = <sphereGeometry args={[decorationScale * 1.5, 16, 16]} />;
      } else if (decoration.includes('Flowers')) {
        decorationGeometry = <coneGeometry args={[decorationScale, decorationScale * 2, 8]} />;
      } else {
        decorationGeometry = <sphereGeometry args={[decorationScale, 16, 16]} />;
      }

      decorations.push(
        <mesh 
          key={`decoration-${index}`} 
          position={[x, yOffset + tierHeight/2 + 0.15, z]}
        >
          {decorationGeometry}
          <meshStandardMaterial 
            color={decoration.includes('Sprinkles') ? '#FF69B4' :
                   decoration.includes('Rainbow Sprinkles') ? '#FF1493' :
                   decoration.includes('Chocolate Sprinkles') ? '#8B4513' :
                   decoration.includes('Strawberry') ? '#FF69B4' :
                   decoration.includes('Blueberry') ? '#4169E1' :
                   decoration.includes('Raspberry') ? '#E30B5D' :
                   decoration.includes('Cherry') ? '#DC143C' :
                   decoration.includes('Orange') ? '#FFA500' :
                   decoration.includes('Lemon') ? '#FFFACD' :
                   decoration.includes('Rose') ? '#FF69B4' :
                   decoration.includes('Daisy') ? '#FFFF00' :
                   decoration.includes('Lily') ? '#FFF0F5' :
                   decoration.includes('Chocolate Chips') ? '#8B4513' :
                   decoration.includes('White Chocolate') ? '#FFFFFF' :
                   decoration.includes('Dark Chocolate') ? '#3C1321' :
                   decoration.includes('Pearls') ? '#FFF5EE' :
                   decoration.includes('Gold') ? '#FFD700' :
                   decoration.includes('Silver') ? '#C0C0C0' : '#FFD700'}
            roughness={decoration.includes('Pearls') || 
                      decoration.includes('Gold') || 
                      decoration.includes('Silver') ? 0.1 : 0.3}
            metalness={decoration.includes('Pearls') || 
                      decoration.includes('Gold') || 
                      decoration.includes('Silver') ? 0.8 : 0.5}
          />
        </mesh>
      );
    });

    return decorations;
  };

  return (
    <group ref={group} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {renderCakeTiers()}
      {renderDecorations()}
    </group>
  );
}

const CakePreview3D = ({ selections }) => {
  return (
    <div className="cake-preview-3d-container">
      <Canvas 
        camera={{ 
          position: [0, 4, 0], // Position camera above the cake
          fov: 50,
          rotation: [-Math.PI / 2, 0, 0] // Point camera downward
        }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />
        <CakeModel selections={selections} />
        <OrbitControls 
          enableZoom={false}
          minPolarAngle={Math.PI/4} // Limit how far down you can rotate
          maxPolarAngle={Math.PI/2.5} // Limit how far up you can rotate
        />
      </Canvas>
    </div>
  );
};

export default CakePreview3D; 
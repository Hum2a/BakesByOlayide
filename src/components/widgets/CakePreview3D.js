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

  return (
    <group ref={group} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Cake Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry 
          args={[
            getCakeSize(selections.size), // top radius
            getCakeSize(selections.size), // bottom radius
            getCakeHeight(selections.size), // height
            32 // segments
          ]} 
        />
        <meshStandardMaterial 
          color={selections.flavor ? getFlavorColor(selections.flavor) : '#FFF8DC'}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Frosting */}
      <mesh position={[0, getCakeHeight(selections.size)/2 + 0.05, 0]}>
        <cylinderGeometry 
          args={[
            getCakeSize(selections.size) + 0.1, // slightly larger than cake
            getCakeSize(selections.size) + 0.1,
            0.1,
            32
          ]} 
        />
        <meshStandardMaterial 
          color={selections.frosting ? getFrostingColor(selections.frosting) : '#f5f5dc'}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Decorations */}
      {selections.decorations && selections.decorations.map((decoration, index) => {
        const totalDecorations = selections.decorations.length;
        const angle = (index / totalDecorations) * Math.PI * 2;
        const radius = getCakeSize(selections.size) * 0.7; // Adjust decoration placement based on cake size
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <mesh 
            key={index} 
            position={[x, getCakeHeight(selections.size)/2 + 0.15, z]}
          >
            <sphereGeometry args={[0.1 * getCakeSize(selections.size) * 0.3, 16, 16]} />
            <meshStandardMaterial 
              color={decoration.includes('Sprinkles') ? '#FF69B4' :
                     decoration.includes('Fruit') ? '#FF6347' :
                     decoration.includes('Chocolate') ? '#8B4513' : '#FFD700'}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        );
      })}
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
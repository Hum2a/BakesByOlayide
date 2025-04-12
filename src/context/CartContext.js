import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Helper function to get initial cart state from localStorage
const getInitialCartState = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return {
        items: parsedCart,
        totalItems: parsedCart.reduce((total, item) => total + item.quantity, 0),
        totalPrice: parsedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return { items: [], totalItems: 0, totalPrice: 0 };
};

export const CartProvider = ({ children }) => {
  // Initialize state with data from localStorage
  const initialState = getInitialCartState();
  const [cart, setCart] = useState(initialState.items);
  const [totalItems, setTotalItems] = useState(initialState.totalItems);
  const [totalPrice, setTotalPrice] = useState(initialState.totalPrice);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      // Calculate totals
      const items = cart.reduce((total, item) => total + item.quantity, 0);
      const price = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      setTotalItems(items);
      setTotalPrice(price);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const value = {
    cart,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 
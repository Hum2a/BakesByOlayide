import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Helper function to get initial cart state from localStorage (for non-authenticated users)
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
  const [cart, setCart] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  // Function to save cart to both localStorage and Firebase
  const saveCart = async (cartItems, userId) => {
    try {
      // Always save to localStorage
      localStorage.setItem('cart', JSON.stringify(cartItems));

      // Only attempt Firebase save if user is authenticated
      if (userId) {
        try {
          const cartRef = doc(db, 'userCarts', userId);
          await setDoc(cartRef, { items: cartItems }, { merge: true });
        } catch (error) {
          // If Firebase save fails, just log it - localStorage is our backup
          console.log('Firebase cart sync failed, using localStorage only:', error.message);
        }
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  // Load cart data when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setLoading(true);
        if (user) {
          // If user is authenticated, try to get cart from Firebase
          try {
            const cartRef = doc(db, 'userCarts', user.uid);
            const cartDoc = await getDoc(cartRef);
            
            if (cartDoc.exists() && cartDoc.data().items) {
              const firebaseCart = cartDoc.data().items;
              setCart(firebaseCart);
              localStorage.setItem('cart', JSON.stringify(firebaseCart));
            } else {
              // If no Firebase cart exists, use localStorage cart
              const localCart = getInitialCartState().items;
              setCart(localCart);
              // Only try to save to Firebase if we have items
              if (localCart.length > 0) {
                await saveCart(localCart, user.uid);
              }
            }
          } catch (error) {
            // If Firebase fails, fallback to localStorage
            console.log('Firebase cart sync failed, using localStorage:', error.message);
            const localCart = getInitialCartState().items;
            setCart(localCart);
          }
        } else {
          // If not authenticated, use localStorage
          const localCart = getInitialCartState().items;
          setCart(localCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to localStorage
        const localCart = getInitialCartState().items;
        setCart(localCart);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update totals whenever cart changes
  useEffect(() => {
    const items = cart.reduce((total, item) => total + item.quantity, 0);
    const price = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    setTotalItems(items);
    setTotalPrice(price);

    // Save cart whenever it changes
    const user = auth.currentUser;
    saveCart(cart, user?.uid);
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

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart');
    const user = auth.currentUser;
    if (user) {
      try {
        const cartRef = doc(db, 'userCarts', user.uid);
        await setDoc(cartRef, { items: [] }, { merge: true });
      } catch (error) {
        console.error('Error clearing cart in Firebase:', error);
      }
    }
  };

  const value = {
    cart,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loading
  };

  if (loading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 
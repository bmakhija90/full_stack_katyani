import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCartItems(cartData);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartService.addToCart(productId, quantity);
      await fetchCart();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.error || 'Failed to add to cart');
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        await removeFromCart(productId);
        return;
      }
      await cartService.updateCartItem(productId, quantity);
      await fetchCart();
      toast.success('Cart updated!');
    } catch (error) {
      toast.error(error.error || 'Failed to update cart');
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await cartService.removeFromCart(productId);
      await fetchCart();
      toast.success('Removed from cart!');
    } catch (error) {
      toast.error(error.error || 'Failed to remove from cart');
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems([]);
      toast.success('Cart cleared!');
    } catch (error) {
      toast.error(error.error || 'Failed to clear cart');
      throw error;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
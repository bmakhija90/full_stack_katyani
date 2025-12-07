import api from './api';

export const cartService = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addToCart: async (productId, quantity) => {
    try {
      const response = await api.post('/cart', { productId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      const response = await api.post('/cart', { productId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  removeFromCart: async (productId) => {
    try {
      const response = await api.delete(`/cart/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  clearCart: async () => {
    try {
      // Get current cart
      const cart = await cartService.getCart();
      // Remove all items one by one (or implement bulk delete in backend)
      for (const item of cart) {
        await cartService.removeFromCart(item.productId);
      }
      return { message: 'Cart cleared successfully' };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
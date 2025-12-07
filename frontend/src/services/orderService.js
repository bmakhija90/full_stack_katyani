import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      console.log('Order created:', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  confirmStripePayment: async (orderId, sessionId) => {
    try {
      const response = await api.post(`/orders/${orderId}/confirm-stripe`, { sessionId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirm Stripe payment success
  confirmOrderSuccess: async (orderId, data) => {
    try {
      const response = await api.post(`/orders/${orderId}/success`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserOrders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/user/orders', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

   getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error.response?.data || error.message;
    }
  },

  addAddress: async (addressData) => {
    try {
      const response = await api.post('/user/address', addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAddresses: async () => {
    try {
      const response = await api.get('/user/addresses');
      return response.data.addresses;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

    // NEW: Delete address function
  deleteAddress: async (addressId) => {
    try {
      const response = await api.delete(`/user/address/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

};
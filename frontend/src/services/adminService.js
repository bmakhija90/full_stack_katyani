import api from './api';

export const adminService = {
  getDashboardStats: async (days = 7) => {
    try {
      const response = await api.get('/stats', { params: { days } });
      console.log('Dashboard stats response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllUsers: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/admin/users', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllOrders: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/admin/orders', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

    updateOrderStatus: async (orderId, updateData) => {
    try {
      // updateData should include { status, shippingInfo? }
      const response = await api.put(`/orders/${orderId}/status`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add these methods to adminService
getAllCategories: async () => {
  try {
    const response = await api.get('/admin/categories');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},

updateCategory: async (categoryId, categoryData) => {
  try {
    const response = await api.put(`/admin/categories/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},

deleteCategory: async (categoryId) => {
  try {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}
};
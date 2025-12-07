import api from './api';
import { setToken, setUserData } from '../utils/helper';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        setToken(response.data.token);
        setUserData(response.data.user || { email: userData.email });
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        setToken(response.data.token);
        setUserData({
          userId: response.data.userId,
          email: credentials.email,
          isAdmin: response.data.isAdmin || false
        });
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    setToken(null);
    setUserData(null);
  },

  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
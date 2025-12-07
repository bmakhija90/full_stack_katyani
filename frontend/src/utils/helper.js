export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const setUserData = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUserData = () => {
  localStorage.removeItem('user');
};

export const isAdmin = () => {
  const user = getUserData();
  return user ? user.isAdmin : false;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
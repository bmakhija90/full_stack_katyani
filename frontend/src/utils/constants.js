export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

export const ORDER_STATUS = {
  processing: { label: 'Processing', color: 'warning' },
  shipped: { label: 'Shipped', color: 'info' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' }
};

export const PAYMENT_METHODS = {
  stripe: 'Credit Card',
  paypal: 'PayPal',
  cod: 'Cash on Delivery'
};
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartItem from './CartItem';
import LoadingSpinner from '../common/LoadingSpinner';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';

const Cart = () => {
  const { cartItems, loading, getCartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
    }
  }, [isAuthenticated, navigate]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading cart..." />;
  }

  const cartTotal = getCartTotal();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container className="py-5">
      <h1 className="mb-4">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaShoppingCart size={64} className="text-muted mb-4" />
            <Card.Title>Your cart is empty</Card.Title>
            <Card.Text className="text-muted mb-4">
              Add some products to your cart and they will appear here.
            </Card.Text>
            <Button as={Link} to="/products" variant="primary">
              Continue Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
                  </h5>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
                
                {cartItems.map(item => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </Card.Body>
            </Card>
            
            <div className="d-flex justify-content-between">
              <Button as={Link} to="/products" variant="outline-primary">
                Continue Shopping
              </Button>
            </div>
          </Col>
          
          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <Card.Title>Order Summary</Card.Title>
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span className="text-success">FREE</span>
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total</strong>
                  <strong className="h5">{formatPrice(cartTotal)}</strong>
                </div>
                
                <Alert variant="info" className="small">
                  <strong>Free shipping</strong> on all orders. Taxes calculated at checkout.
                </Alert>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mb-3"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <FaArrowRight className="ms-2" />
                </Button>
                
                <div className="text-center">
                  <small className="text-muted">
                    Secure checkout powered by Stripe
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Cart;
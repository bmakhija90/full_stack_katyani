import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaShoppingBag, FaHome, FaEnvelope } from 'react-icons/fa';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helper';
import { toast } from 'react-toastify';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const confirmOrder = async () => {
      try {
        setConfirming(true);
        
        // Get session_id from URL if it exists (from Stripe redirect)
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');
        
        // If this is a Stripe payment, confirm it
        if (sessionId) {
          try {
            await orderService.confirmOrderSuccess(orderId, { session_id: sessionId });
            toast.success('Payment confirmed successfully!');
          } catch (error) {
            console.error('Payment confirmation error:', error);
            // Don't fail the page load if confirmation fails
          }
        }
        
        // Force clear cart (as backup)
        await clearCart();
        
        // Fetch order details
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
        
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
        setConfirming(false);
      }
    };

    if (orderId) {
      confirmOrder();
    } else {
      navigate('/');
    }
  }, [orderId, location.search]);

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleViewOrder = () => {
    navigate(`/my-orders/${orderId}`);
  };

  if (loading || confirming) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h5 className="mt-3">
          {confirming ? 'Confirming your payment...' : 'Loading order details...'}
        </h5>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h5>Order not found</h5>
          <p>The order you're looking for doesn't exist.</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Success Message */}
          <Card className="border-success mb-4">
            <Card.Body className="text-center py-5">
              <FaCheckCircle size={80} className="text-success mb-4" />
              <h2 className="text-success mb-3">Order Confirmed!</h2>
              <p className="lead">
                Thank you for your purchase. Your order #{orderId.slice(-8)} has been received.
              </p>
              <p className="text-muted">
                We've sent a confirmation email to <strong>{order.customerEmail || 'your email'}</strong>
              </p>
            </Card.Body>
          </Card>

          {/* Order Summary */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4">
                <FaShoppingBag className="me-2" />
                Order Summary
              </Card.Title>
              
              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h6>Order Details</h6>
                    <p className="mb-1">
                      <strong>Order ID:</strong> {orderId.slice(-8)}
                    </p>
                    <p className="mb-1">
                      <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mb-1">
                      <strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        order.orderStatus === 'processing' ? 'bg-warning' :
                        order.orderStatus === 'shipped' ? 'bg-info' :
                        order.orderStatus === 'delivered' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </p>
                    <p className="mb-0">
                      <strong>Payment:</strong> 
                      <span className={`badge ms-2 ${
                        order.paymentStatus === 'paid' ? 'bg-success' :
                        order.paymentStatus === 'pending' ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-4">
                    <h6>Delivery Address</h6>
                    {order.shippingAddress && (
                      <>
                        <p className="mb-1"><strong>{order.shippingAddress.name}</strong></p>
                        <p className="mb-1">{order.shippingAddress.street}</p>
                        <p className="mb-1">{order.shippingAddress.city}, {order.shippingAddress.county}</p>
                        <p className="mb-1">{order.shippingAddress.postcode}</p>
                        <p className="mb-0">{order.shippingAddress.country}</p>
                      </>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Order Items */}
              <div className="mb-4">
                <h6>Items Ordered</h6>
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                      <p className="mb-1">
                        {item.name} × {item.quantity}
                      </p>
                      <small className="text-muted">SKU: {item.productId?.slice(-6)}</small>
                    </div>
                    <div className="text-end">
                      <p className="mb-0">{formatPrice(item.price * item.quantity)}</p>
                      <small className="text-muted">{formatPrice(item.price)} each</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
             // OrderSuccess.jsx - Update the Order Total section

{/* Order Total */}

<div className="bg-light p-3 rounded">
  <div className="d-flex justify-content-between mb-2">
    <span>Subtotal</span>
    <span>{formatPrice(order.totalAmount || 0)}</span>
  </div>
  {/* Shipping Fee */}
  <div className="d-flex justify-content-between mb-2">
    <span>Shipping Fee</span>
    <span>{formatPrice(order.shippingCost || 3.5)}</span>
  </div>
  <div className="d-flex justify-content-between border-top pt-2">
    <strong>Total</strong>
    <strong className="h5">
      {formatPrice(
        order.grandTotal || 
        (order.totalAmount || 0) + (order.shippingCost || 3.5)
      )}
    </strong>
  </div>
</div>
            </Card.Body>
          </Card>

          {/* Next Steps */}
          <Card>
            <Card.Body>
              <Card.Title>What's Next?</Card.Title>
              <ul className="mb-4">
                <li>You'll receive an order confirmation email shortly</li>
                <li>We'll notify you when your order ships</li>
                <li>Delivery typically takes 3-5 business days</li>
                <li>Track your order from your account dashboard</li>
              </ul>
              
              <div className="d-flex gap-3">
                <Button variant="primary" onClick={handleContinueShopping}>
                  <FaShoppingBag className="me-2" />
                  Continue Shopping
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/')}>
                  <FaHome className="me-2" />
                  Go to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccess;
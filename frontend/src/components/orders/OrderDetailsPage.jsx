import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaHome, FaShoppingBag, FaPrint } from 'react-icons/fa';
import OrderDetailsModal from '../orders/OrderDetailsModal';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/helper';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        setOrder(response.order);
      } else {
        setError(response.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h5>Error Loading Order</h5>
          <p>{error}</p>
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/my-orders')}>
              <FaArrowLeft className="me-2" />
              Back to Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <h5>Order Not Found</h5>
          <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/my-orders')}>
              <FaArrowLeft className="me-2" />
              Back to Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/" className="text-decoration-none">
              <FaHome className="me-1" />
              Home
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/profile" className="text-decoration-none">
              My Account
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/my-orders" className="text-decoration-none">
              My Orders
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Order #{order.orderNumber}
          </li>
        </ol>
      </nav>

      {/* Order Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                <FaShoppingBag className="me-2" />
                Order #{order.orderNumber}
              </h1>
              <p className="text-muted mb-0">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => navigate('/my-orders')}>
                <FaArrowLeft className="me-1" />
                Back to Orders
              </Button>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <FaPrint className="me-1" />
                View Invoice
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Quick Summary */}
      // OrderDetailsPage.jsx - Add shipping fee to quick summary

{/* Quick Summary */}
<Row className="mb-4">
  <Col md={2}>
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="text-center">
        <h6 className="text-muted mb-2">Status</h6>
        <Badge 
          bg="info" 
          className="px-3 py-2"
          style={{ fontSize: '1rem' }}
        >
          {order.orderStatus}
        </Badge>
      </Card.Body>
    </Card>
  </Col>
  <Col md={2}>
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="text-center">
        <h6 className="text-muted mb-2">Items</h6>
        <h4 className="mb-0">{order.items.length}</h4>
      </Card.Body>
    </Card>
  </Col>
  <Col md={2}>
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="text-center">
        <h6 className="text-muted mb-2">Subtotal</h6>
        <h4 className="mb-0">{formatPrice(order.totalAmount)}</h4>
      </Card.Body>
    </Card>
  </Col>
  <Col md={3}>
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="text-center">
        <h6 className="text-muted mb-2">Shipping Fee</h6>
        <h4 className="mb-0">{formatPrice(order.shippingCost || 3.5)}</h4>
      </Card.Body>
    </Card>
  </Col>
  <Col md={3}>
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="text-center">
        <h6 className="text-muted mb-2">Total Amount</h6>
        <h4 className="mb-0 text-primary">{formatPrice(order.grandTotal)}</h4>
      </Card.Body>
    </Card>
  </Col>
</Row>

      {/* Modal for Detailed View */}
      <OrderDetailsModal
        orderId={orderId}
        show={showModal}
        onHide={() => {
          setShowModal(false);
          navigate('/my-orders');
        }}
      />
    </Container>
  );
};

export default OrderDetailsPage;
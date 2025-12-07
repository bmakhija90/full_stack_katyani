import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Table, Alert, Spinner } from 'react-bootstrap';
import { 
  FaReceipt, FaTruck, FaCreditCard, FaMapMarkerAlt, 
  FaCalendar, FaUser, FaBox, FaShoppingBag, FaFileInvoice,
  FaPrint, FaDownload, FaTimes, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaInfoCircle, FaTag
} from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';
import { orderService } from '../../services/orderService';
import { toast } from 'react-toastify';

// Order status configuration
const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: <FaClock /> },
  processing: { label: 'Processing', color: 'info', icon: <FaBox /> },
  shipped: { label: 'Shipped', color: 'primary', icon: <FaTruck /> },
  delivered: { label: 'Delivered', color: 'success', icon: <FaCheckCircle /> },
  cancelled: { label: 'Cancelled', color: 'danger', icon: <FaTimes /> }
};

// Payment status configuration
const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: <FaClock /> },
  paid: { label: 'Paid', color: 'success', icon: <FaCheckCircle /> },
  failed: { label: 'Failed', color: 'danger', icon: <FaExclamationTriangle /> },
  refunded: { label: 'Refunded', color: 'secondary', icon: <FaTimes /> }
};

// Payment method configuration
const PAYMENT_METHOD_CONFIG = {
  stripe: { label: 'Credit Card', icon: <FaCreditCard /> },
  cod: { label: 'Cash on Delivery', icon: <FaReceipt /> },
  paypal: { label: 'PayPal', icon: <FaCreditCard /> }
};

const OrderDetailsModal = ({ orderId, show, onHide, onStatusUpdate }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (show && orderId) {
      fetchOrderDetails();
    }
  }, [show, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        setOrder(response.order);
      } else {
        toast.error(response.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as "${newStatus}"?`)) {
      return;
    }

    setUpdating(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to "${newStatus}"`);
      fetchOrderDetails(); // Refresh data
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('invoice-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order?.orderNumber}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
            .invoice-header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .invoice-footer { border-top: 2px solid #000; padding-top: 20px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading order details...</p>
        </Modal.Body>
      </Modal>
    );
  }

  if (!order) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Body className="text-center py-5">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h5>Order Not Found</h5>
          <p className="text-muted">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button variant="outline-primary" onClick={onHide}>
            Close
          </Button>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title>
          <FaShoppingBag className="me-2" />
          Order Details - #{order.orderNumber}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div id="invoice-content">
          {/* Invoice Header */}
          <div className="invoice-header mb-4">
            <Row className="mb-3">
              <Col>
                <h4 className="text-primary mb-1">INVOICE</h4>
                <p className="text-muted mb-0">Order #{order.orderNumber}</p>
              </Col>
              <Col className="text-end">
                <Badge bg="light" className="text-dark border p-2">
                  <FaTag className="me-2" />
                  Invoice Date: {formatDate(order.createdAt)}
                </Badge>
              </Col>
            </Row>
          </div>

          {/* Order Status & Info */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <FaInfoCircle className="me-2" />
                    Order Information
                  </h6>
                  <div className="row small">
                    <div className="col-6">
                      <p className="text-muted mb-1">Order Status</p>
                      <Badge 
                        bg={ORDER_STATUS_CONFIG[order.orderStatus]?.color || 'secondary'}
                        className="px-3 py-2 d-inline-flex align-items-center"
                      >
                        {ORDER_STATUS_CONFIG[order.orderStatus]?.icon}
                        <span className="ms-2">
                          {ORDER_STATUS_CONFIG[order.orderStatus]?.label || order.orderStatus}
                        </span>
                      </Badge>
                    </div>
                    <div className="col-6">
                      <p className="text-muted mb-1">Payment Status</p>
                      <Badge 
                        bg={PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || 'secondary'}
                        className="px-3 py-2 d-inline-flex align-items-center"
                      >
                        {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.icon}
                        <span className="ms-2">
                          {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col md={6}>
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <FaCreditCard className="me-2" />
                    Payment Information
                  </h6>
                  <div className="row small">
                    <div className="col-6">
                      <p className="text-muted mb-1">Payment Method</p>
                      <p className="mb-0">
                        {PAYMENT_METHOD_CONFIG[order.paymentMethod]?.icon}
                        <span className="ms-2">
                          {PAYMENT_METHOD_CONFIG[order.paymentMethod]?.label || order.paymentMethod}
                        </span>
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted mb-1">Order Date</p>
                      <p className="mb-0">
                        <FaCalendar className="me-2" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Customer & Shipping Information */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <FaUser className="me-2" />
                    Customer Information
                  </h6>
                  <div className="mb-2">
                    <strong>{order.user?.name}</strong>
                  </div>
                  <div className="mb-1">
                    <FaUser className="me-2 text-muted" size={14} />
                    {order.user?.email}
                  </div>
                  {order.user?.phone && (
                    <div className="mb-1">
                      <FaCreditCard className="me-2 text-muted" size={14} />
                      {order.user.phone}
                    </div>
                  )}
                </div>
              </div>
            </Col>
            
            <Col md={6}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <FaMapMarkerAlt className="me-2" />
                    Shipping Address
                  </h6>
                  {order.shippingAddress ? (
                    <>
                      <div className="mb-2">
                        <strong>{order.shippingAddress.name}</strong>
                      </div>
                      <div className="mb-1">
                        {order.shippingAddress.street}
                      </div>
                      <div className="mb-1">
                        {order.shippingAddress.city}, {order.shippingAddress.county}
                      </div>
                      <div className="mb-1">
                        {order.shippingAddress.postcode}
                      </div>
                      <div className="mb-1">
                        {order.shippingAddress.country}
                      </div>
                      {order.shippingAddress.phone && (
                        <div className="mb-1">
                          <FaCreditCard className="me-2 text-muted" size={14} />
                          {order.shippingAddress.phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted mb-0">No shipping address provided</p>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Order Items Table */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3">
                <FaBox className="me-2" />
                Order Items
              </h6>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Price</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="img-fluid rounded"
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                  />
                                ) : (
                                  <FaBox className="text-muted" />
                                )}
                              </div>
                            </div>
                            <div>
                              <strong className="d-block">{item.name}</strong>
                              <small className="text-muted">SKU: {item.productId || 'N/A'}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center align-middle">
                          {formatPrice(item.price)}
                        </td>
                        <td className="text-center align-middle">
                          <span className="badge bg-light text-dark px-3 py-2">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-end align-middle">
                          <strong>{formatPrice(item.price * item.quantity)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>

          {/* Order Summary */}
         // OrderDetailsModal.jsx - Update the Order Summary section

{/* Order Summary */}
// Update the Order Summary section in OrderDetailsModal.jsx
<Row>
  <Col md={6}></Col>
  <Col md={6}>
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h6 className="card-title mb-3">Order Summary</h6>
        <Table borderless size="sm">
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td className="text-end">{formatPrice(order.totalAmount || 0)}</td>
            </tr>
            {/* Shipping Fee - Always show */}
            <tr>
              <td>Shipping Fee</td>
              <td className="text-end">
                {formatPrice(order.shippingCost || 3.5)}
                {order.shippingFeeConfig && (
                  <div className="text-muted small">
                    Flat rate: £{order.shippingFeeConfig.toFixed(2)}
                  </div>
                )}
              </td>
            </tr>
            <tr className="border-top">
              <td><strong>Total Amount</strong></td>
              <td className="text-end">
                <strong className="h4 text-primary">
                  {formatPrice(order.grandTotal || (order.totalAmount || 0) + (order.shippingCost || 3.5))}
                </strong>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  </Col>
</Row>

          {/* Tracking Information (if available) */}
          {order.trackingNumber && (
            <div className="card border-primary border-2 mt-4">
              <div className="card-body">
                <h6 className="card-title mb-3">
                  <FaTruck className="me-2" />
                  Tracking Information
                </h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-1">
                      <strong>Tracking Number:</strong> {order.trackingNumber}
                    </p>
                    {order.carrier && (
                      <p className="mb-1">
                        <strong>Carrier:</strong> {order.carrier}
                      </p>
                    )}
                  </Col>
                  <Col md={6}>
                    {order.deliveryDate && (
                      <p className="mb-1">
                        <strong>Estimated Delivery:</strong> {formatDate(order.deliveryDate)}
                      </p>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {/* Invoice Footer */}
          <div className="invoice-footer mt-4 pt-4 border-top">
            <Row>
              <Col>
                <div className="text-center">
                  <p className="text-muted mb-2">
                    Thank you for your business!
                  </p>
                  <small className="text-muted">
                    If you have any questions, please contact our customer support.
                  </small>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-top-0">
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button 
              variant="outline-primary" 
              className="me-2 no-print"
              onClick={handlePrintInvoice}
            >
              <FaPrint className="me-1" />
              Print Invoice
            </Button>
            <Button 
              variant="outline-secondary" 
              className="no-print"
              onClick={() => window.print()}
            >
              <FaFileInvoice className="me-1" />
              Print Page
            </Button>
          </div>
          <div>
            <Button 
              variant="outline-secondary" 
              className="me-2 no-print"
              onClick={onHide}
            >
              Close
            </Button>
            
        
            
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetailsModal;
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Modal, Form, Dropdown, InputGroup, Pagination, Alert 
} from 'react-bootstrap';
import { 
  FaEye, FaEdit, FaTrash, FaFilter, FaSearch, 
  FaCheckCircle, FaTimesCircle, FaShippingFast,
  FaBoxOpen, FaMoneyBillWave, FaUser 
} from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import { toast } from 'react-toastify';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllOrders(currentPage, itemsPerPage);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setStatusToUpdate(order.orderStatus);
    setCourierName(order.shippingInfo?.courierName || '');
    setTrackingNumber(order.shippingInfo?.trackingNumber || '');
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !statusToUpdate) return;

    // Validate required fields for shipped status
    if (statusToUpdate === 'shipped') {
      if (!courierName.trim()) {
        toast.error('Please enter courier company name');
        return;
      }
      if (!trackingNumber.trim()) {
        toast.error('Please enter tracking number');
        return;
      }
    }

    try {
      const updateData = {
        status: statusToUpdate
      };

      // Add shipping info if status is shipped
      if (statusToUpdate === 'shipped') {
        updateData.shippingInfo = {
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          shippedAt: new Date().toISOString()
        };
      }

      await adminService.updateOrderStatus(selectedOrder._id, updateData);
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      resetStatusModal();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const resetStatusModal = () => {
    setCourierName('');
    setTrackingNumber('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = ORDER_STATUS[status] || { label: status, color: 'secondary' };
    return (
      <Badge bg={statusConfig.color} className="px-2 py-1">
        {statusConfig.label}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const variant = paymentStatus === 'completed' ? 'success' : 
                   paymentStatus === 'pending' ? 'warning' : 'danger';
    return (
      <Badge bg={variant} className="px-2 py-1">
        {paymentStatus}
      </Badge>
    );
  };

  // Helper to display shipping info in table
  const renderShippingInfo = (order) => {
    if (order.orderStatus === 'shipped' && order.shippingInfo) {
      return (
        <div className="small text-muted mt-1">
          <div>{order.shippingInfo.courierName}</div>
          <div>Tracking: {order.shippingInfo.trackingNumber}</div>
        </div>
      );
    }
    return null;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingInfo?.trackingNumber && 
       order.shippingInfo.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === '' || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Order Management</h1>
        <div className="text-muted">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by Order ID, User ID, or Tracking Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(ORDER_STATUS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
              >
                <FaFilter className="me-2" />
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Orders Table */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td>
                      <code className="small">#{order._id.substring(-8)}</code>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaUser className="me-2 text-muted" />
                        <span>{order.shippingAddress?.name}</span>
                      </div>
                    </td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString()}
                      <div className="small text-muted">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {order.items?.length || 0} items
                      </Badge>
                    </td>
                    <td>
                      <strong>{formatPrice(order.totalAmount)}</strong>
                    </td>
                    <td>
                      {getStatusBadge(order.orderStatus)}
                      {renderShippingInfo(order)}
                    </td>
                    <td>
                      <div>
                        {getPaymentBadge(order.paymentStatus)}
                        <div className="small text-muted">
                          {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          title="View Details"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleUpdateStatus(order)}
                          title="Update Status"
                        >
                          <FaEdit />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-5">
              <FaBoxOpen size={48} className="text-muted mb-3" />
              <p className="text-muted">No orders found</p>
              {searchTerm || statusFilter ? (
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                >
                  Clear filters to see all orders
                </Button>
              ) : null}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages).keys()].map(num => {
                  const pageNum = num + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <Pagination.Ellipsis key={pageNum} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Order Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Order ID:</strong></td>
                        <td><code>{selectedOrder._id}</code></td>
                      </tr>
                      <tr>
                        <td><strong>Date:</strong></td>
                        <td>{new Date(selectedOrder.createdAt).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>{getStatusBadge(selectedOrder.orderStatus)}</td>
                      </tr>
                      {selectedOrder.shippingInfo && (
                        <>
                          <tr>
                            <td><strong>Courier:</strong></td>
                            <td>{selectedOrder.shippingInfo.courierName}</td>
                          </tr>
                          <tr>
                            <td><strong>Tracking No:</strong></td>
                            <td><code>{selectedOrder.shippingInfo.trackingNumber}</code></td>
                          </tr>
                          {selectedOrder.shippingInfo.shippedAt && (
                            <tr>
                              <td><strong>Shipped At:</strong></td>
                              <td>{new Date(selectedOrder.shippingInfo.shippedAt).toLocaleString()}</td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr>
                        <td><strong>Payment:</strong></td>
                        <td>
                          {getPaymentBadge(selectedOrder.paymentStatus)}
                          <div className="small">
                            {PAYMENT_METHODS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>User ID:</strong></td>
                        <td><code>{selectedOrder.userId}</code></td>
                      </tr>
                      {selectedOrder.shippingAddress && (
                        <>
                          <tr>
                            <td><strong>Name:</strong></td>
                            <td>{selectedOrder.shippingAddress.name}</td>
                          </tr>
                          <tr>
                            <td><strong>Phone:</strong></td>
                            <td>{selectedOrder.shippingAddress.phone}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <h6>Shipping Address</h6>
              {selectedOrder.shippingAddress ? (
                <Card className="mb-4">
                  <Card.Body>
                    <p className="mb-1">{selectedOrder.shippingAddress.street}</p>
                    <p className="mb-1">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="mb-0">{selectedOrder.shippingAddress.country}</p>
                  </Card.Body>
                </Card>
              ) : (
                <p className="text-muted">No shipping address provided</p>
              )}

              <h6>Order Items</h6>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                    <td><strong>{formatPrice(selectedOrder.totalAmount)}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setShowDetailsModal(false);
              handleUpdateStatus(selectedOrder);
            }}
          >
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Alert variant="info" className="small">
                Updating status for order <code>#{selectedOrder._id.substring(-8)}</code>
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Select New Status</Form.Label>
                <Form.Select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value)}
                >
                  {Object.entries(ORDER_STATUS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Shipping Information - Required when status is 'shipped' */}
              {statusToUpdate === 'shipped' && (
                <div className="border rounded p-3 mb-3 bg-light">
                  <h6 className="mb-3">
                    <FaShippingFast className="me-2" />
                    Shipping Information (Required)
                  </h6>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Courier Company Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., FedEx, UPS, DHL, etc."
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      Enter the name of the shipping company
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tracking Number *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      Customers will use this to track their shipment
                    </Form.Text>
                  </Form.Group>

                  <Alert variant="warning" className="small mt-3">
                    <strong>Note:</strong> Both fields are required when marking an order as shipped.
                  </Alert>
                </div>
              )}

              {/* Status Flow Visualization */}
              <div className="mt-4">
                <h6>Status Flow:</h6>
                <div className="d-flex align-items-center justify-content-between">
                  {['processing', 'shipped', 'delivered'].map(status => (
                    <div key={status} className="text-center">
                      <div className={`rounded-circle p-2 mb-2 ${
                        statusToUpdate === status 
                          ? 'bg-primary text-white' 
                          : 'bg-light'
                      }`}>
                        {status === 'processing' && <FaBoxOpen />}
                        {status === 'shipped' && <FaShippingFast />}
                        {status === 'delivered' && <FaCheckCircle />}
                      </div>
                      <small>{ORDER_STATUS[status]?.label || status}</small>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;
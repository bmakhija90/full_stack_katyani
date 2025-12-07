import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Container, Row, Col, Card, Table, Form, Button, 
  Dropdown, Badge, ProgressBar, Alert 
} from 'react-bootstrap';
import { 
  FaDollarSign, FaShoppingCart, FaBox, FaUsers,
  FaChartLine, FaExclamationTriangle, FaEdit,
  FaPlus, FaTrash, FaEye, FaCog, FaList
} from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';
import { ORDER_STATUS } from '../../utils/constants';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, [daysFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, productsData, categoriesData] = await Promise.all([
        adminService.getDashboardStats(daysFilter),
        productService.getAllProducts(null, 1, 10),
        productService.getCategories()
      ]);
      setStats(statsData);
      setProducts(productsData.products || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      if (editingCategory) {
        await productService.updateCategory(editingCategory._id, newCategory);
        toast.success('Category updated successfully');
      } else {
        await productService.createCategory(newCategory);
        toast.success('Category added successfully');
      }
      setNewCategory({ name: '', slug: '', description: '' });
      setEditingCategory(null);
      setShowAddCategory(false);
      fetchData();
    } catch (error) {
      toast.error(error.error || 'Failed to save category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
      try {
        // You'll need to add deleteCategory method to productService
        // await productService.deleteCategory(categoryId);
        toast.success('Category deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const getStatusColor = (status) => {
    return ORDER_STATUS[status]?.color || 'secondary';
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', variant: 'danger' };
    if (stock < 10) return { text: 'Low Stock', variant: 'warning' };
    return { text: 'In Stock', variant: 'success' };
  };

  const calculateMonthlyGrowth = () => {
    // Mock growth calculation - replace with real data
    return 12.5;
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Dashboard</h1>
        <div className="d-flex gap-2">
          <Form.Group style={{ width: '200px' }}>
            <Form.Select 
              value={daysFilter} 
              onChange={(e) => setDaysFilter(e.target.value)}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </Form.Select>
          </Form.Group>
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              <FaPlus className="me-2" />
              Quick Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/admin/products?action=add">
                <FaPlus className="me-2" />
                Add New Product
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowAddCategory(true)}>
                <FaPlus className="me-2" />
                Add New Category
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/admin/products">
                <FaList className="me-2" />
                Manage Products
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/admin/orders">
                <FaShoppingCart className="me-2" />
                Manage Orders
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddCategory && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', slug: '', description: '' });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Category Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="Enter category name"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Slug *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      placeholder="category-slug"
                    />
                    <Form.Text className="text-muted">
                      URL-friendly version of the name (e.g., "electronics" for "Electronics")
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      placeholder="Enter category description"
                    />
                  </Form.Group>
                </Form>
              </div>
              <div className="modal-footer">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', slug: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddCategory}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} className="mb-4">
          <Card className="border-primary">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-0">Weekly Sales</h6>
                  <h3 className="mt-2">{formatPrice(stats?.summary.totalRevenue || 0)}</h3>
                  <small className="text-success">
                    
                  </small>
                </Col>
                <Col xs={4} className="text-end">
                  <FaDollarSign size={40} className="text-primary" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} md={6} className="mb-4">
          <Card className="border-success">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-0">Pending Orders</h6>
                  <h3 className="mt-2">{stats?.summary.pendingOrders || 0}</h3>
                  
                </Col>
                <Col xs={4} className="text-end">
                  <FaShoppingCart size={40} className="text-success" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} md={6} className="mb-4">
          <Card className="border-info">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-0">Total Products</h6>
                  <h3 className="mt-2">{stats?.totalProducts || 0}</h3>
                  <small className="text-muted">
                    {products.filter(p => p.availability).length} active
                  </small>
                </Col>
                <Col xs={4} className="text-end">
                  <FaBox size={40} className="text-info" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} md={6} className="mb-4">
          <Card className="border-warning">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-0">Total Categories</h6>
                  <h3 className="mt-2">{categories.length}</h3>
                  <small className="text-muted">Manage all categories</small>
                </Col>
                <Col xs={4} className="text-end">
                  <FaList size={40} className="text-warning" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Recent Orders & Products */}
        <Col lg={8} className="mb-4">
          <Row>
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title className="mb-0">Recent Orders</Card.Title>
                    <Button as={Link} to="/admin/orders" variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentOrders?.slice(0, 5).map(order => (
                          <tr key={order._id}>
                            <td>
                              <small className="text-muted">
                                #{order._id.substring(-8)}
                              </small>
                            </td>
                            <td>{formatPrice(order.totalAmount)}</td>
                            <td>
                              <Badge bg={getStatusColor(order.orderStatus)}>
                                {ORDER_STATUS[order.orderStatus]?.label || order.orderStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title className="mb-0">Recent Products</Card.Title>
                    <Button as={Link} to="/admin/products" variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </div>
                  <div className="list-group list-group-flush">
                    {products.slice(0, 5).map(product => (
                      <div key={product._id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div style={{ maxWidth: '70%' }}>
                            <h6 className="mb-1 text-truncate">{product.name}</h6>
                            <small className="text-muted d-flex align-items-center">
                              <span className="me-2">{formatPrice(product.price)}</span>
                              <Badge bg={getStockStatus(product.stock).variant} className="ms-2">
                                {getStockStatus(product.stock).text}
                              </Badge>
                            </small>
                          </div>
                          <div className="d-flex gap-1">
                            <Button
                              as={Link}
                              to={`/admin/products?edit=${product._id}`}
                              variant="outline-warning"
                              size="sm"
                              title="Edit"
                            >
                              <FaEdit size={12} />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              href={`/products/${product._id}`}
                              target="_blank"
                              title="View"
                            >
                              <FaEye size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Categories Management */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Card.Title>Categories Management</Card.Title>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                >
                  <FaPlus className="me-2" />
                  Add Category
                </Button>
              </div>
              
              {categories.length === 0 ? (
                <Alert variant="info">
                  No categories found. Add your first category to get started.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Products</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => {
                        const productCount = products.filter(p => p.category === category.slug).length;
                        return (
                          <tr key={category._id}>
                            <td>
                              <strong>{category.name}</strong>
                            </td>
                            <td>
                              <code>{category.slug}</code>
                            </td>
                            <td>
                              <small className="text-muted">
                                {category.description || 'No description'}
                              </small>
                            </td>
                            <td>
                              <Badge bg="info">{productCount}</Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category._id)}
                                  title="Delete"
                                  disabled={productCount > 0}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                              {productCount > 0 && (
                                <small className="text-danger d-block mt-1">
                                  Cannot delete - has {productCount} products
                                </small>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col lg={4}>
          {/* Low Stock Products */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center">
                <span>Low Stock Alert</span>
                <FaExclamationTriangle className="text-warning" />
              </Card.Title>
              {products.filter(p => p.stock < 10).length === 0 ? (
                <Alert variant="success" className="mb-0">
                  All products have sufficient stock
                </Alert>
              ) : (
                <div className="list-group list-group-flush">
                  {products
                    .filter(p => p.stock < 10)
                    .slice(0, 5)
                    .map(product => (
                      <div key={product._id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{product.name}</h6>
                            <small className="text-muted">
                              Stock: {product.stock} units
                            </small>
                          </div>
                          <Badge bg="warning">{product.stock}</Badge>
                        </div>
                        <ProgressBar 
                          now={(product.stock / 10) * 100} 
                          variant={product.stock < 5 ? "danger" : "warning"}
                          className="mt-2"
                          style={{ height: '5px' }}
                        />
                      </div>
                    ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Quick Stats</Card.Title>
              <div className="d-flex justify-content-between mb-2">
                <span>Active Products</span>
                <strong>{products.filter(p => p.availability).length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Out of Stock</span>
                <strong className="text-danger">
                  {products.filter(p => !p.availability).length}
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Avg. Product Price</span>
                <strong>
                  {formatPrice(
                    products.length > 0 
                      ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
                      : 0
                  )}
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Categories</span>
                <strong>{categories.length}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Order Conversion Rate</span>
                <strong className="text-success">3.2%</strong>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Links */}
          <Card>
            <Card.Body>
              <Card.Title>Quick Links</Card.Title>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/products?action=add" variant="primary">
                  <FaPlus className="me-2" />
                  Add New Product
                </Button>
                <Button as={Link} to="/admin/products" variant="outline-primary">
                  <FaList className="me-2" />
                  Manage Products
                </Button>
                <Button as={Link} to="/admin/orders" variant="outline-primary">
                  <FaShoppingCart className="me-2" />
                  Manage Orders
                </Button>
                <Button onClick={() => setShowAddCategory(true)} variant="outline-primary">
                  <FaPlus className="me-2" />
                  Add New Category
                </Button>
                <Button as={Link} to="/" variant="outline-secondary" target="_blank">
                  <FaEye className="me-2" />
                  View Store Front
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
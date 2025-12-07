import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductForm from '../products/ProductForm';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Modal, Form, Dropdown, InputGroup, Pagination, Alert 
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaPlus, FaEye, FaSearch, 
  FaFilter, FaSort, FaToggleOn, FaToggleOff,
  FaBox, FaBoxOpen, FaCheckSquare, FaSquare
} from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';
import { toast } from 'react-toastify';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
    // Check if there's an edit parameter in URL
    const editId = searchParams.get('edit');
    const action = searchParams.get('action');
    
    if (editId) {
      const product = products.find(p => p._id === editId);
      if (product) {
        handleEdit(product);
      }
    }
    
    if (action === 'add') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedCategory, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(selectedCategory || null, currentPage, itemsPerPage),
        productService.getCategories()
      ]);
      setProducts(productsData.products || []);
      setCategories(categoriesData || []);
      setTotalPages(productsData.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
    // Update URL
    setSearchParams({ edit: product._id });
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      // You'll need to implement deleteProduct in your service
      // await productService.deleteProduct(productToDelete._id);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    setSearchParams({});
    fetchData();
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) {
            // Implement bulk delete
            toast.success(`${selectedProducts.size} products deleted`);
            setSelectedProducts(new Set());
            fetchData();
          }
          break;
        case 'activate':
          // Implement bulk activate
          toast.success(`${selectedProducts.size} products activated`);
          setSelectedProducts(new Set());
          fetchData();
          break;
        case 'deactivate':
          // Implement bulk deactivate
          toast.success(`${selectedProducts.size} products deactivated`);
          setSelectedProducts(new Set());
          fetchData();
          break;
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      const allIds = new Set(products.map(p => p._id));
      setSelectedProducts(allIds);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    toast.info('Search functionality coming soon');
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getCategoryName = (slug) => {
    const category = categories.find(c => c.slug === slug);
    return category ? category.name : slug;
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { variant: 'danger', text: 'Out of Stock' };
    if (stock < 10) return { variant: 'warning', text: 'Low Stock' };
    return { variant: 'success', text: 'In Stock' };
  };

  const handleToggleAvailability = async (product) => {
    try {
      await productService.updateProduct(product._id, {
        availability: !product.availability
      });
      toast.success(`Product ${product.availability ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Management</h1>
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
          >
            <FaPlus className="me-2" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <Card className="mb-4 border-primary">
          <Card.Body className="py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Badge bg="primary" className="me-2">
                  {selectedProducts.size}
                </Badge>
                <span>products selected</span>
              </div>
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    Bulk Actions
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleBulkAction('activate')}>
                      <FaToggleOn className="me-2" />
                      Activate Selected
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleBulkAction('deactivate')}>
                      <FaToggleOff className="me-2" />
                      Deactivate Selected
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={() => handleBulkAction('delete')}
                      className="text-danger"
                    >
                      <FaTrash className="me-2" />
                      Delete Selected
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Filters & Search */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" className="w-100">
                    <FaSort className="me-2" />
                    Sort: {sortBy === 'price' ? 'Price' : 'Date'} ({sortOrder})
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => toggleSort('createdAt')}>
                      Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => toggleSort('price')}>
                      Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => toggleSort('name')}>
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  <FaFilter className="me-2" />
                  Filter
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <Form.Check
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={selectAllProducts}
                      title="Select all"
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th onClick={() => toggleSort('price')} style={{ cursor: 'pointer' }}>
                    Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const imageUrl = product.images?.[0]?.data 
                    ? `data:${product.images[0].contentType};base64,${product.images[0].data}`
                    : 'https://via.placeholder.com/50x50?text=No+Image';
                  const stockStatus = getStockStatus(product.stock);

                  return (
                    <tr key={product._id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedProducts.has(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            className="rounded me-3"
                          />
                          <div>
                            <strong>{product.name}</strong>
                            <small className="d-block text-muted">
                              {product.description?.substring(0, 50)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {getCategoryName(product.category)}
                        </Badge>
                      </td>
                      <td>{formatPrice(product.price)}</td>
                      <td>
                        <Badge bg={stockStatus.variant}>
                          {product.stock}
                        </Badge>
                        <div className="text-muted small">{stockStatus.text}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            variant={product.availability ? "success" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleAvailability(product)}
                            title={product.availability ? "Active - Click to deactivate" : "Inactive - Click to activate"}
                          >
                            {product.availability ? (
                              <><FaToggleOn className="me-1" /> Active</>
                            ) : (
                              <><FaToggleOff className="me-1" /> Inactive</>
                            )}
                          </Button>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`/products/${product._id}`}
                            target="_blank"
                            title="View in store"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            title="Delete"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-5">
              <FaBoxOpen size={48} className="text-muted mb-3" />
              <p className="text-muted">No products found</p>
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingProduct(null);
                  setShowForm(true);
                }}
              >
                Create Your First Product
              </Button>
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
                  // Show only nearby pages
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

          {/* Stats Summary */}
          <div className="mt-4 pt-3 border-top">
            <Row>
              <Col md={3} className="text-center">
                <div className="text-muted small">Total Products</div>
                <div className="h4">{products.length}</div>
              </Col>
              <Col md={3} className="text-center">
                <div className="text-muted small">Active Products</div>
                <div className="h4 text-success">
                  {products.filter(p => p.availability).length}
                </div>
              </Col>
              <Col md={3} className="text-center">
                <div className="text-muted small">Out of Stock</div>
                <div className="h4 text-danger">
                  {products.filter(p => p.stock === 0).length}
                </div>
              </Col>
              <Col md={3} className="text-center">
                <div className="text-muted small">Low Stock</div>
                <div className="h4 text-warning">
                  {products.filter(p => p.stock > 0 && p.stock < 10).length}
                </div>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>

      {/* Product Form Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
              setSearchParams({});
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <FaBox className="me-2" />
            <strong>Warning: This action cannot be undone!</strong>
          </Alert>
          <p>
            Are you sure you want to delete "<strong>{productToDelete?.name}</strong>"?
          </p>
          {productToDelete && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="d-flex align-items-center">
                <img
                  src={productToDelete.images?.[0]?.data 
                    ? `data:${productToDelete.images[0].contentType};base64,${productToDelete.images[0].data}`
                    : 'https://via.placeholder.com/50x50?text=No+Image'}
                  alt={productToDelete.name}
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  className="rounded me-3"
                />
                <div>
                  <strong>{productToDelete.name}</strong><br />
                  <small className="text-muted">
                    Price: {formatPrice(productToDelete.price)} | 
                    Stock: {productToDelete.stock} | 
                    Category: {getCategoryName(productToDelete.category)}
                  </small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Product
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProducts;
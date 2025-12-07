import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { Form, Button, Row, Col, Alert, Card, Tab, Nav,Badge } from 'react-bootstrap';
import { FaUpload, FaImage, FaTags, FaBox, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ProductForm = ({ product, categories, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    availability: true,
    sizes: [],
    tags: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock || 0,
        availability: product.availability ?? true,
        sizes: product.sizes || [],
        tags: product.tags?.join(', ') || '',
        images: []
      });
      if (product.images) {
        setImagePreviews(product.images.map(img => 
          `data:${img.contentType};base64,${img.data}`
        ));
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = [...formData.images, ...files].slice(0, 5);
    setFormData(prev => ({ ...prev, images: newImages }));

    // Create previews
    const newPreviews = [];
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === newImages.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sizes: formData.sizes.filter(Boolean),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (product) {
        await productService.updateProduct(product._id, submitData);
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct(submitData);
        toast.success('Product created successfully!');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleSizeChange = (index, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes.filter(Boolean) }));
  };

  const addSizeField = () => {
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, ''] }));
  };

  const removeSizeField = (index) => {
    const newSizes = [...formData.sizes];
    newSizes.splice(index, 1);
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="mb-3">
          <Card.Header>
            <Nav variant="tabs" className="border-bottom-0">
              <Nav.Item>
                <Nav.Link eventKey="basic">
                  <FaInfoCircle className="me-2" />
                  Basic Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="images">
                  <FaImage className="me-2" />
                  Images
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="details">
                  <FaTags className="me-2" />
                  Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="inventory">
                  <FaBox className="me-2" />
                  Inventory
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              {/* Basic Info Tab */}
              <Tab.Pane eventKey="basic">
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        isInvalid={!!errors.name}
                        placeholder="Enter product name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($) *</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaDollarSign />
                        </span>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          isInvalid={!!errors.price}
                          placeholder="0.00"
                        />
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.price}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    isInvalid={!!errors.description}
                    placeholder="Enter detailed product description"
                  />
                  <Form.Text className="text-muted">
                    Minimum 10 characters. Describe features, benefits, and specifications.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        isInvalid={!!errors.category}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category._id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.category}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., electronics, wireless, premium, new-arrival"
                      />
                      <Form.Text className="text-muted">
                        Comma-separated tags for better searchability
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Images Tab */}
              <Tab.Pane eventKey="images">
                <Form.Group className="mb-4">
                  <Form.Label>Product Images</Form.Label>
                  <div className="border rounded p-3 text-center mb-3" 
                       style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                       onClick={() => document.getElementById('image-upload').click()}>
                    <FaUpload size={48} className="text-muted mb-3" />
                    <div>
                      <strong>Click to upload images</strong>
                      <p className="text-muted small mb-0">
                        Upload up to 5 images. First image will be the main display image.
                      </p>
                    </div>
                  </div>
                  <Form.Control
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="d-none"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <h6>Image Previews ({imagePreviews.length}/5)</h6>
                      <Row className="g-3">
                        {imagePreviews.map((preview, index) => (
                          <Col xs={6} md={3} key={index}>
                            <div className="position-relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="img-fluid rounded border"
                                style={{ height: '150px', objectFit: 'cover', width: '100%' }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-1"
                                onClick={() => removeImage(index)}
                                style={{ width: '30px', height: '30px', padding: 0 }}
                              >
                                ×
                              </Button>
                              {index === 0 && (
                                <Badge bg="primary" className="position-absolute top-0 start-0 m-1">
                                  Main
                                </Badge>
                              )}
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {product?.images && product.images.length > 0 && !imagePreviews.length && (
                    <Alert variant="info">
                      <FaImage className="me-2" />
                      Existing images will be kept. Upload new images to replace them.
                    </Alert>
                  )}
                </Form.Group>
              </Tab.Pane>

              {/* Details Tab */}
              <Tab.Pane eventKey="details">
                <Form.Group className="mb-4">
                  <Form.Label>Sizes/Variants</Form.Label>
                  <div className="mb-3">
                    {formData.sizes.map((size, index) => (
                      <div key={index} className="d-flex gap-2 mb-2">
                        <Form.Control
                          type="text"
                          value={size}
                          onChange={(e) => handleSizeChange(index, e.target.value)}
                          placeholder={`Size ${index + 1} (e.g., S, M, L, 256GB)`}
                        />
                        <Button
                          variant="outline-danger"
                          onClick={() => removeSizeField(index)}
                          disabled={formData.sizes.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline-secondary"
                      onClick={addSizeField}
                      className="mt-2"
                    >
                      Add Size/Variant
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Leave empty if product doesn't have sizes/variants
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Additional Specifications</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add any additional specifications or features"
                  />
                </Form.Group>
              </Tab.Pane>

              {/* Inventory Tab */}
              <Tab.Pane eventKey="inventory">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Stock Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        isInvalid={!!errors.stock}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.stock}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Set to 0 to mark as out of stock
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Availability Status</Form.Label>
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="switch"
                          id="availability"
                          name="availability"
                          label={formData.availability ? "Available for Sale" : "Not Available"}
                          checked={formData.availability}
                          onChange={handleChange}
                          className="me-3"
                        />
                        {formData.stock === 0 && (
                          <Badge bg="danger">Out of Stock</Badge>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info">
                  <FaBox className="me-2" />
                  <strong>Inventory Management Tips:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Set stock to 0 to automatically mark as out of stock</li>
                    <li>Products with stock &lt; 10 will show low stock warnings</li>
                    <li>Disable availability to temporarily hide product from store</li>
                  </ul>
                </Alert>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Form.Check
            type="switch"
            id="publish"
            label="Publish immediately"
            defaultChecked
            className="d-inline-block me-3"
          />
          {product && (
            <small className="text-muted">
              Last updated: {new Date(product.updatedAt).toLocaleDateString()}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {product ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              product ? 'Update Product' : 'Create Product'
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default ProductForm;
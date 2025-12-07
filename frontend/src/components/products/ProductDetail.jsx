import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Container, Row, Col, Button, Badge, Alert, Image, Form } from 'react-bootstrap';
import { FaShoppingCart, FaArrowLeft, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/helper';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Add this state
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
      if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Function to handle image click
  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Product not found
        </Alert>
        <Button variant="outline-primary" onClick={() => navigate('/products')}>
          <FaArrowLeft className="me-2" />
          Back to Products
        </Button>
      </Container>
    );
  }

  // Get the selected image based on selectedImageIndex
  const selectedImage = product.images?.[selectedImageIndex];
  const mainImage = selectedImage?.data 
    ? `data:${selectedImage.contentType};base64,${selectedImage.data}`
    : 'https://via.placeholder.com/500x400?text=No+Image';

  return (
    <Container className="py-5">
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate('/products')}
        className="mb-4"
      >
        <FaArrowLeft className="me-2" />
        Back to Products
      </Button>

      <Row className="g-4">
        <Col lg={6}>
          <div className="card p-3">
            {/* Main Image */}
            <Image
              src={mainImage}
              alt={product.name}
              fluid
              className="rounded mb-3"
              style={{ 
                width: '100%', 
                height: '400px', 
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={() => {
                // Optional: Open image in lightbox/modal
                // You can implement a lightbox here if needed
              }}
            />
            
            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="d-flex gap-2 mt-3 overflow-auto">
                {product.images.map((img, index) => (
                  <div 
                    key={index}
                    className={`border rounded p-1 ${selectedImageIndex === index ? 'border-primary border-2' : 'border-secondary'}`}
                    style={{ 
                      minWidth: '80px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleImageClick(index)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Image
                      src={`data:${img.contentType};base64,${img.data}`}
                      alt={`${product.name} ${index + 1}`}
                      thumbnail
                      style={{ 
                        width: '100%', 
                        height: '60px', 
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Image Navigation Dots (optional) */}
            {product.images && product.images.length > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-3">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    className={`btn btn-sm ${selectedImageIndex === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      padding: 0,
                      borderRadius: '50%'
                    }}
                    onClick={() => handleImageClick(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h1 className="h3 mb-0">{product.name}</h1>
              <Badge bg={product.availability ? 'success' : 'danger'}>
                {product.availability ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>

            <div className="mb-4">
              <span className="h2 text-primary">{formatPrice(product.price)}</span>
              {product.stock > 0 && (
                <span className="text-muted ms-3">
                  In stock
                </span>
              )}
            </div>

            <div className="mb-4">
              <h5 className="mb-2">Description</h5>
              <p className="text-muted">{product.description}</p>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <h5 className="mb-0 me-2">Category:</h5>
                <Badge bg="secondary">{product.category}</Badge>
              </div>
              
              {product.tags && product.tags.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <Badge key={tag} bg="light" text="dark" className="border">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <Form.Group className="mb-4">
                <Form.Label>Size</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'primary' : 'outline-secondary'}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            )}

            <Form.Group className="mb-4">
              <Form.Label>Quantity</Form.Label>
              <div className="d-flex align-items-center">
                <Button
                  variant="outline-secondary"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Form.Control
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mx-2 text-center"
                  style={{ width: '80px' }}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.availability}
              >
                <FaShoppingCart className="me-2" />
                Add to Cart
              </Button>
              
              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => navigate('/checkout')}
                disabled={!product.availability}
              >
                Buy Now
              </Button>
            </div>

            {!product.availability && (
              <Alert variant="warning" className="mt-3">
                This product is currently out of stock. Check back later!
              </Alert>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
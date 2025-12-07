import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/helper';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const imageUrl = product.images?.[0]?.data 
    ? `data:${product.images[0].contentType};base64,${product.images[0].data}`
    : 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Card className="h-100">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
        {!product.availability && (
          <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
            Out of Stock
          </Badge>
        )}
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h6 mb-2">{product.name}</Card.Title>
        <Card.Text className="text-muted small mb-2 flex-grow-1">
          {product.description?.substring(0, 60)}...
        </Card.Text>
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="h5 text-primary mb-0">
              {formatPrice(product.price)}
            </span>
            <Badge bg="secondary">{product.category}</Badge>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/products/${product._id}`} className="w-50">
              <Button variant="outline-primary" className="w-100">
                <FaEye className="me-1" /> View
              </Button>
            </Link>
            <Button
              variant="primary"
              className="w-50"
              onClick={handleAddToCart}
              disabled={!product.availability}
            >
              <FaShoppingCart className="me-1" /> Add
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
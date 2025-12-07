import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Row, Col, Image, Button, Form } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity >= 1) {
      updateQuantity(item.productId, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.productId);
  };

  const imageUrl = item.product?.image?.data 
    ? `data:${item.product.image.contentType};base64,${item.product.image.data}`
    : 'https://via.placeholder.com/100x100?text=No+Image';

  const subtotal = (item.product?.price || 0) * item.quantity;

  return (
    <Row className="align-items-center py-3 border-bottom">
      <Col md={2}>
        <Link to={`/products/${item.productId}`}>
          <Image
            src={imageUrl}
            alt={item.product?.name}
            fluid
            className="rounded"
            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
          />
        </Link>
      </Col>
      
      <Col md={4}>
        <Link to={`/products/${item.productId}`} className="text-decoration-none">
          <h6 className="mb-1">{item.product?.name}</h6>
        </Link>
        {item.product?.availability === false && (
          <small className="text-danger">Out of stock</small>
        )}
      </Col>
      
      <Col md={2}>
        <span className="h6">{formatPrice(item.product?.price)}</span>
      </Col>
      
      <Col md={2}>
        <Form.Select
          value={item.quantity}
          onChange={handleQuantityChange}
          size="sm"
          disabled={item.product?.availability === false}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </Form.Select>
      </Col>
      
      <Col md={1}>
        <span className="h6">{formatPrice(subtotal)}</span>
      </Col>
      
      <Col md={1}>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={handleRemove}
          title="Remove item"
        >
          <FaTrash />
        </Button>
      </Col>
    </Row>
  );
};

export default CartItem;
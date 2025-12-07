import React, { useState } from 'react';
import { orderService } from '../../services/orderService';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AddressForm = ({ onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'USA',
    phone: initialData?.phone || '',
    isDefault: initialData?.isDefault || false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const required = ['name', 'street', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!formData[field]?.trim()) {
        toast.error(`Please enter ${field}`);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await orderService.addAddress(formData);
      toast.success('Address added successfully!');
      if (onSuccess) {
        onSuccess();
      }
      // Reset form if not editing
      if (!initialData) {
        setFormData({
          name: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
          phone: '',
          isDefault: false
        });
      }
    } catch (error) {
      toast.error(error.error || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name *</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-3">
        <Form.Label>Street Address *</Form.Label>
        <Form.Control
          type="text"
          name="street"
          value={formData.street}
          onChange={handleChange}
          required
        />
      </Form.Group>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>City *</Form.Label>
            <Form.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>State *</Form.Label>
            <Form.Control
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>ZIP Code *</Form.Label>
            <Form.Control
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-4">
        <Form.Label>Country *</Form.Label>
        <Form.Control
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
        />
      </Form.Group>
      
      <Form.Group className="mb-4">
        <Form.Check
          type="checkbox"
          id="isDefault"
          name="isDefault"
          label="Set as default address"
          checked={formData.isDefault}
          onChange={handleChange}
        />
      </Form.Group>
      
      <div className="d-flex gap-2">
        <Button 
          variant="primary" 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
        <Button 
          variant="outline-secondary" 
          type="button"
          onClick={() => {
            if (initialData) {
              // If editing, reset to initial data
              setFormData(initialData);
            } else {
              // If adding new, clear form
              setFormData({
                name: '',
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'USA',
                phone: '',
                isDefault: false
              });
            }
          }}
        >
          Reset
        </Button>
      </div>
    </Form>
  );
};

export default AddressForm;
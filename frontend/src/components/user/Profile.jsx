import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Container, Row, Col, Card, Nav, Table, Button, Badge, Form, ListGroup, InputGroup, Modal } from 'react-bootstrap';
import { FaUser, FaMapMarkerAlt, FaBox, FaEdit, FaTrash, FaHome, FaCity, FaMapPin, FaPhone, FaGlobe, FaUserCircle, FaSearch, FaSpinner, FaBuilding, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { formatPrice } from '../../utils/helper';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../utils/constants';

import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Postcode search state
  const [postcode, setPostcode] = useState('');
  const [postcodeError, setPostcodeError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    houseNumber: '',
    street: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    isDefault: true // New addresses should be default by default
  });
  const [addressErrors, setAddressErrors] = useState({});
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, addressesData] = await Promise.all([
        orderService.getUserOrders(),
        orderService.getAddresses()
      ]);
      setOrders(ordersData.orders || []);
      setAddresses(addressesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate UK postcode format
  const validateUKPostcode = (postcodeInput) => {
    const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcodeInput.trim());
  };

  const validateUKPhone = (phone) => {
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone.trim());
  };

  // Fetch addresses from UK Postcode API
  const searchPostcode = async (postcodeInput) => {
    const cleanedPostcode = postcodeInput.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!validateUKPostcode(cleanedPostcode)) {
      setPostcodeError('Please enter a valid UK postcode');
      setAddressSuggestions([]);
      return;
    }
    
    setPostcodeError('');
    setIsSearching(true);
    
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanedPostcode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 200 && data.result) {
          const result = data.result;
          
          // Extract address details
          const ward = result.admin_ward || result.primary_care_trust || '';
          const district = result.admin_district || result.nuts || '';
          const county = result.admin_county || result.region || '';
          const country = result.country || 'United Kingdom';
          
          // Create primary suggestion
          const primarySuggestion = {
            id: 'primary',
            houseNumber: '',
            street: ward || district || 'Street Address',
            city: district,
            county: county,
            postcode: result.postcode,
            country: country,
            rawData: result
          };
          
          setAddressSuggestions([primarySuggestion]);
          setShowSuggestions(true);
          
        } else {
          setPostcodeError('Postcode not found');
          setAddressSuggestions([]);
        }
      } else {
        setPostcodeError('Unable to find addresses for this postcode');
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching postcode:', error);
      setPostcodeError('Failed to fetch address. Please enter manually.');
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle postcode input
  const handlePostcodeChange = (e) => {
    const value = e.target.value;
    setPostcode(value);
    setPostcodeError('');
    
    if (value.trim().length > 5 && validateUKPostcode(value)) {
      searchPostcode(value);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select an address from suggestions
  const handleSelectAddress = (address) => {
    setNewAddress(prev => ({
      ...prev,
      houseNumber: '',
      street: address.street || '',
      city: address.city || '',
      county: address.county || address.rawData?.admin_ward || '',
      postcode: address.postcode || postcode,
      country: address.country || 'United Kingdom'
    }));
    
    setShowSuggestions(false);
    setPostcode(address.postcode || postcode);
  };

  // Manual address entry
  const handleManualAddressEntry = () => {
    setNewAddress(prev => ({
      ...prev,
      houseNumber: '',
      street: '',
      city: '',
      county: '',
      postcode: postcode
    }));
    setShowSuggestions(false);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
    if (addressErrors[name]) {
      setAddressErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveAddress = async () => {
    const errors = {};
    
    if (!newAddress.name.trim()) errors.name = 'Full name is required';
    if (!newAddress.phone.trim()) errors.phone = 'Phone number is required';
    else if (!validateUKPhone(newAddress.phone)) errors.phone = 'Please enter a valid UK phone number';
    
    if (!newAddress.street.trim()) errors.street = 'Street address is required';
    if (!newAddress.city.trim()) errors.city = 'City is required';
    if (!newAddress.county.trim()) errors.county = 'County is required';
    
    if (!newAddress.postcode.trim()) errors.postcode = 'Postcode is required';
    else if (!validateUKPostcode(newAddress.postcode)) errors.postcode = 'Please enter a valid UK postcode';
    
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    try {
      // Combine house number with street if provided
      const fullAddress = {
        ...newAddress,
        street: newAddress.houseNumber 
          ? `${newAddress.houseNumber} ${newAddress.street}`
          : newAddress.street
      };

      if (editingAddress) {
        await orderService.updateAddress(editingAddress._id, fullAddress);
        setSuccessMessage('Address updated successfully!');
      } else {
        // When adding new address, make it default and all others non-default
        await orderService.addAddress(fullAddress);
        setSuccessMessage('Address added successfully!');
      }
      
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setShowAddressForm(false);
        setEditingAddress(null);
        resetAddressForm();
        fetchData();
        setActiveTab('addresses');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save address:', error);
      // You could show an error toast here
    }
  };

  const resetAddressForm = () => {
    setNewAddress({
      name: '',
      phone: '',
      houseNumber: '',
      street: '',
      city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom',
      isDefault: true
    });
    setPostcode('');
    setPostcodeError('');
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setAddressErrors({});
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    
    // Parse house number from street if exists
    let houseNumber = '';
    let street = address.street;
    
    // Try to extract house number (e.g., "10 Main Street" -> houseNumber: "10", street: "Main Street")
    const match = address.street.match(/^(\d+\s*[A-Za-z]*)\s+(.+)$/);
    if (match) {
      houseNumber = match[1].trim();
      street = match[2].trim();
    }
    
    setNewAddress({
      name: address.name || '',
      phone: address.phone || '',
      houseNumber: houseNumber,
      street: street || '',
      city: address.city || '',
      county: address.county || '',
      postcode: address.postcode || '',
      country: address.country || 'United Kingdom',
      isDefault: address.isDefault || false
    });
    
    setPostcode(address.postcode || '');
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    const addressToDelete = addresses.find(addr => addr._id === addressId);
    
    if (!addressToDelete) return;
    
    if (addressToDelete.isDefault) {
      alert('Cannot delete default address. Please set another address as default first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await orderService.deleteAddress(addressId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete address:', error);
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      // First, update all addresses to non-default
      // Then set the selected one as default
      // This is handled by the backend in orderService.setDefaultAddress
      await orderService.setDefaultAddress(addressId);
      fetchData();
    } catch (error) {
      console.error('Failed to set default address:', error);
    }
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    resetAddressForm();
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">My Account</h1>
      
      <Row>
        {/* Profile Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <FaUserCircle size={40} className="text-white" />
                </div>
              </div>
              <h5 className="mb-1">{user.firstName} {user.lastName}</h5>
              <p className="text-muted mb-2">{user.email}</p>
              <Badge bg={user.isAdmin ? "primary" : "secondary"} className="mb-3">
                {user.isAdmin ? "Administrator" : "Customer"}
              </Badge>
              
              <Nav variant="pills" className="flex-column mt-3">
                <Nav.Item>
                  <Nav.Link 
                    eventKey="profile" 
                    active={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    className="text-start"
                  >
                    <FaUser className="me-2" />
                    Profile
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="addresses" 
                    active={activeTab === 'addresses'}
                    onClick={() => setActiveTab('addresses')}
                    className="text-start"
                  >
                    <FaMapMarkerAlt className="me-2" />
                    Addresses
                    {addresses.length > 0 && (
                      <Badge bg="primary" className="ms-2">{addresses.length}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="orders" 
                    active={activeTab === 'orders'}
                    onClick={() => setActiveTab('orders')}
                    className="text-start"
                  >
                    <FaBox className="me-2" />
                    Orders
                    {orders.length > 0 && (
                      <Badge bg="primary" className="ms-2">{orders.length}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Main Content */}
        <Col lg={9}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="mb-4">
                  <FaUser className="me-2" />
                  Personal Information
                </Card.Title>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Full Name</h6>
                      <p className="h5">{user.firstName} {user.lastName}</p>
                    </div>
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Email Address</h6>
                      <p className="h5">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Phone Number</h6>
                      <p className="h5">{user.phone || 'Not provided'}</p>
                    </div>
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Account Since</h6>
                      <p className="h5">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-light rounded">
                  <h6>Account Summary</h6>
                  <Row className="mt-3">
                    <Col xs={6} className="text-center">
                      <div className="p-3">
                        <h3 className="text-primary">{orders.length}</h3>
                        <p className="text-muted mb-0">Total Orders</p>
                      </div>
                    </Col>
                    <Col xs={6} className="text-center">
                      <div className="p-3">
                        <h3 className="text-primary">{addresses.length}</h3>
                        <p className="text-muted mb-0">Saved Addresses</p>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <Card.Title className="mb-0">
                      <FaMapMarkerAlt className="me-2" />
                      Shipping Addresses
                    </Card.Title>
                    <p className="text-muted mb-0">Manage your delivery addresses</p>
                  </div>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      setEditingAddress(null);
                      resetAddressForm();
                      setShowAddressForm(true);
                    }}
                  >
                    <FaEdit className="me-1" />
                    Add New Address
                  </Button>
                </div>
                
                {showAddressForm ? (
                  <Card className="border-primary mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5>{editingAddress ? 'Edit Address' : 'Add New Address'}</h5>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={handleCancelAddressForm}
                        >
                          <FaTimes className="me-1" />
                          Cancel
                        </Button>
                      </div>
                      
                      <Form>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaUser className="me-2" />
                                Full Name *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                value={newAddress.name}
                                onChange={handleAddressChange}
                                isInvalid={!!addressErrors.name}
                                placeholder="John Smith"
                              />
                              <Form.Control.Feedback type="invalid">
                                {addressErrors.name}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaPhone className="me-2" />
                                Phone Number *
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                name="phone"
                                value={newAddress.phone}
                                onChange={handleAddressChange}
                                isInvalid={!!addressErrors.phone}
                                placeholder="07123 456789"
                              />
                              <Form.Text className="text-muted">
                                Format: 07123 456789 or +44 7123 456789
                              </Form.Text>
                              <Form.Control.Feedback type="invalid">
                                {addressErrors.phone}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Postcode Search Section */}
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaMapPin className="me-2" />
                            Find Address by Postcode *
                          </Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="text"
                              value={postcode}
                              onChange={handlePostcodeChange}
                              isInvalid={!!postcodeError}
                              placeholder="Enter UK postcode (e.g., SW1A 1AA)"
                              disabled={isSearching}
                            />
                            <Button 
                              variant="outline-secondary"
                              onClick={() => searchPostcode(postcode)}
                              disabled={!postcode.trim() || isSearching}
                            >
                              {isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                            </Button>
                          </InputGroup>
                          {postcodeError && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {postcodeError}
                            </Form.Control.Feedback>
                          )}
                          <Form.Text className="text-muted">
                            Enter your postcode to auto-fill your address
                          </Form.Text>
                        </Form.Group>

                        {/* Address Suggestions Dropdown */}
                        {showSuggestions && addressSuggestions.length > 0 && (
                          <Card className="mb-3 border-primary">
                            <Card.Body className="p-2">
                              <h6 className="mb-2">Select your address:</h6>
                              <ListGroup variant="flush">
                                {addressSuggestions.map((address, index) => (
                                  <ListGroup.Item 
                                    key={address.id || index}
                                    action
                                    onClick={() => handleSelectAddress(address)}
                                    className="py-2"
                                  >
                                    <div className="d-flex align-items-center">
                                      <FaMapMarkerAlt className="text-primary me-2" />
                                      <div>
                                        <strong>{address.street}</strong>
                                        <div className="small text-muted">
                                          {address.city}, {address.county}, {address.postcode}
                                        </div>
                                      </div>
                                    </div>
                                  </ListGroup.Item>
                                ))}
                                <ListGroup.Item 
                                  action
                                  onClick={handleManualAddressEntry}
                                  className="py-2"
                                >
                                  <div className="d-flex align-items-center">
                                    <FaHome className="text-muted me-2" />
                                    <div>
                                      <strong>Enter address manually</strong>
                                      <div className="small text-muted">
                                        I'll fill in the details myself
                                      </div>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              </ListGroup>
                            </Card.Body>
                          </Card>
                        )}

                        {/* House Number Field */}
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaBuilding className="me-2" />
                            House/Flat Number
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="houseNumber"
                            value={newAddress.houseNumber}
                            onChange={handleAddressChange}
                            placeholder="e.g., 10, Flat 2A"
                          />
                          <Form.Text className="text-muted">
                            Enter your house or flat number (optional)
                          </Form.Text>
                        </Form.Group>

                        {/* Street Address */}
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaHome className="me-2" />
                            Street Address *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="street"
                            value={newAddress.street}
                            onChange={handleAddressChange}
                            isInvalid={!!addressErrors.street}
                            placeholder="Main Street, High Road, etc."
                            className={newAddress.street.trim() !== '' ? 'bg-light' : ''}
                          />
                          <Form.Control.Feedback type="invalid">
                            {addressErrors.street}
                          </Form.Control.Feedback>
                        </Form.Group>

                        {/* City and County */}
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaCity className="me-2" />
                                City/Town *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="city"
                                value={newAddress.city}
                                onChange={handleAddressChange}
                                isInvalid={!!addressErrors.city}
                                placeholder="London, Manchester, etc."
                                className={newAddress.city.trim() !== '' ? 'bg-light' : ''}
                              />
                              <Form.Control.Feedback type="invalid">
                                {addressErrors.city}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaMapPin className="me-2" />
                                County *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="county"
                                value={newAddress.county}
                                onChange={handleAddressChange}
                                isInvalid={!!addressErrors.county}
                                placeholder="County will auto-fill"
                                readOnly={newAddress.county.trim() !== ''}
                                className={newAddress.county.trim() !== '' ? 'bg-light' : ''}
                              />
                              <Form.Control.Feedback type="invalid">
                                {addressErrors.county}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Postcode and Country */}
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaGlobe className="me-2" />
                                Postcode *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="postcode"
                                value={newAddress.postcode}
                                onChange={handleAddressChange}
                                isInvalid={!!addressErrors.postcode}
                                placeholder="SW1A 1AA"
                                readOnly={newAddress.postcode.trim() !== ''}
                                className={newAddress.postcode.trim() !== '' ? 'bg-light' : ''}
                              />
                              <Form.Control.Feedback type="invalid">
                                {addressErrors.postcode}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <FaGlobe className="me-2" />
                                Country
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value="United Kingdom"
                                readOnly
                                disabled
                                className="bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Default Checkbox - For new addresses, it's always default. For editing, optional */}
                        <Form.Group className="mb-4">
                          <Form.Check
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            label={
                              editingAddress 
                                ? "Set as default shipping address"
                                : "Set as default shipping address (new addresses are default by default)"
                            }
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress(prev => ({
                              ...prev,
                              isDefault: e.target.checked
                            }))}
                            disabled={!editingAddress} // For new addresses, always default
                          />
                        </Form.Group>

                        <div className="d-flex gap-2">
                          <Button variant="primary" onClick={handleSaveAddress}>
                            {editingAddress ? 'Update Address' : 'Save Address'}
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            onClick={handleCancelAddressForm}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                ) : null}
                
                {addresses.length === 0 ? (
                  <div className="text-center py-5">
                    <FaMapMarkerAlt size={48} className="text-muted mb-3" />
                    <h5>No addresses saved yet</h5>
                    <p className="text-muted mb-4">Add your first delivery address to get started</p>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        setEditingAddress(null);
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                    >
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <Row>
                    {addresses.map(address => (
                      <Col md={6} key={address._id} className="mb-3">
                        <Card className={`h-100 ${address.isDefault ? 'border-primary border-2' : 'border-light'}`}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{address.name}</h6>
                              {address.isDefault && (
                                <Badge bg="primary">
                                  <FaCheckCircle className="me-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            
                            <div className="mb-3">
                              <p className="mb-1">
                                <FaHome className="me-2 text-muted" size={12} />
                                {address.street}
                              </p>
                              <p className="mb-1">
                                <FaCity className="me-2 text-muted" size={12} />
                                {address.city}, {address.county}
                              </p>
                              <p className="mb-1">
                                <FaMapPin className="me-2 text-muted" size={12} />
                                {address.postcode}
                              </p>
                              <p className="mb-1">
                                <FaGlobe className="me-2 text-muted" size={12} />
                                {address.country}
                              </p>
                              {address.phone && (
                                <p className="mb-0">
                                  <FaPhone className="me-2 text-muted" size={12} />
                                  {address.phone}
                                </p>
                              )}
                            </div>
                            
                            <div className="d-flex gap-2 mt-3">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                              >
                                <FaEdit className="me-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleSetDefault(address._id)}
                                disabled={address.isDefault}
                              >
                                Set Default
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteAddress(address._id)}
                                disabled={address.isDefault && addresses.length > 1}
                              >
                                <FaTrash className="me-1" />
                                Delete
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="mb-4">
                  <FaBox className="me-2" />
                  Order History
                </Card.Title>
                
                {orders.length === 0 ? (
                  <div className="text-center py-5">
                    <FaBox size={48} className="text-muted mb-3" />
                    <h5>No orders yet</h5>
                    <p className="text-muted mb-4">Start shopping to see your orders here</p>
                    <Button variant="primary" href="/products">
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order._id}>
                            <td>
                              <small className="text-muted">#{order._id.slice(-8)}</small>
                            </td>
                            <td>
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td>{order.items.length} items</td>
                            <td className="fw-semibold">{formatPrice(order.totalAmount)}</td>
                            <td>
                              <Badge bg={ORDER_STATUS[order.orderStatus]?.color || 'secondary'} className="px-3 py-2">
                                {ORDER_STATUS[order.orderStatus]?.label || order.orderStatus}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={order.paymentStatus === 'completed' ? 'success' : 'warning'} className="px-3 py-2">
                                {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                 onClick={() => navigate(`/my-orders/${order._id}`)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal show={showSuccessModal} centered onHide={() => setShowSuccessModal(false)}>
        <Modal.Body className="text-center p-5">
          <div className="mb-3">
            <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
              <FaCheckCircle size={30} className="text-white" />
            </div>
          </div>
          <h5 className="mb-3">{successMessage}</h5>
          <p className="text-muted">Redirecting to addresses...</p>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Profile;
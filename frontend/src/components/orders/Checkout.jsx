// Checkout.jsx - Complete file with handleAddressSubmit function

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Container, Row, Col, Card, Form, Button, Alert, Table, 
  ProgressBar, Modal, Spinner, ListGroup, InputGroup
} from 'react-bootstrap';
import { 
  FaMapMarkerAlt, FaCreditCard, FaCheckCircle, 
  FaShoppingBag, FaLock, FaUser, FaHome,
  FaCity, FaMapPin, FaPhone, FaGlobe, FaExclamationTriangle,
  FaSearch, FaSpinner, FaBuilding, FaShippingFast
} from 'react-icons/fa';
import { formatPrice, getUserData } from '../../utils/helper';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('address');
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  
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
    isDefault: false
  });
  const [addressErrors, setAddressErrors] = useState({});
  
  // Configurable shipping fee - could be fetched from API
  const shippingFee = 3.50; // Default, can be made configurable via API

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    fetchAddresses();
  }, [isAuthenticated, cartItems, navigate]);

  const fetchAddresses = async () => {
    try {
      const data = await orderService.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        setSelectedAddress(data[0]._id);
      } else {
        setUseNewAddress(true);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setUseNewAddress(true);
    } finally {
      setLoading(false);
    }
  };

  // Validate UK postcode format
  const validateUKPostcode = (postcode) => {
    const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
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
      // First, try to get the primary address for this postcode
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanedPostcode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 200 && data.result) {
          const result = data.result;
          
          // Extract full address details from the response
          const ward = result.admin_ward || result.primary_care_trust || '';
          const district = result.admin_district || result.nuts || '';
          const county = result.admin_county || result.region || '';
          const country = result.country || 'United Kingdom';
          
          // Create primary suggestion with better formatted address
          const primarySuggestion = {
            id: 'primary',
            houseNumber: '',
            street: ward || district || 'Street Address',
            city: district,
            county: county,
            postcode: result.postcode,
            country: country,
            rawData: result // Store raw data for reference
          };
          
          setAddressSuggestions([primarySuggestion]);
          
          // Also search for multiple addresses at this postcode
          try {
            const autocompleteResponse = await fetch(
              `https://api.postcodes.io/postcodes/${cleanedPostcode}/autocomplete`
            );
            
            if (autocompleteResponse.ok) {
              const autocompleteData = await autocompleteResponse.json();
              
              if (autocompleteData.status === 200 && autocompleteData.result && autocompleteData.result.length > 0) {
                // For each autocomplete suggestion, get full details
                const suggestionsPromises = autocompleteData.result.slice(0, 5).map(async (partialAddress) => {
                  try {
                    const lookupResponse = await fetch(
                      `https://api.postcodes.io/postcodes/${cleanedPostcode}/autocomplete/${encodeURIComponent(partialAddress)}`
                    );
                    if (lookupResponse.ok) {
                      const lookupData = await lookupResponse.json();
                      if (lookupData.status === 200 && lookupData.result) {
                        const lookupResult = lookupData.result;
                        return {
                          id: `suggestion_${partialAddress}`,
                          houseNumber: '',
                          street: partialAddress,
                          city: lookupResult.admin_district || district,
                          county: lookupResult.admin_county || county,
                          postcode: lookupResult.postcode || result.postcode,
                          country: lookupResult.country || country,
                          rawData: lookupResult
                        };
                      }
                    }
                  } catch (error) {
                    console.log('Error fetching individual address:', error);
                  }
                  return null;
                });
                
                const additionalSuggestions = (await Promise.all(suggestionsPromises)).filter(s => s !== null);
                
                if (additionalSuggestions.length > 0) {
                  setAddressSuggestions(prev => [...prev, ...additionalSuggestions]);
                }
              }
            }
          } catch (error) {
            console.log('Autocomplete failed, using primary only');
          }
          
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

  // Handle postcode input with debounce
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
    // Reset house number when selecting new address
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

  const validateAddress = () => {
    const errors = {};
    
    if (useNewAddress) {
      if (!newAddress.name.trim()) errors.name = 'Full name is required';
      if (!newAddress.phone.trim()) errors.phone = 'Phone number is required';
      else if (!validateUKPhone(newAddress.phone)) errors.phone = 'Please enter a valid UK phone number';
      
      if (!newAddress.street.trim()) errors.street = 'Street address is required';
      if (!newAddress.city.trim()) errors.city = 'City is required';
      if (!newAddress.county.trim()) errors.county = 'County is required';
      
      if (!newAddress.postcode.trim()) errors.postcode = 'Postcode is required';
      else if (!validateUKPostcode(newAddress.postcode)) errors.postcode = 'Please enter a valid UK postcode';
    } else if (!selectedAddress) {
      errors.address = 'Please select a shipping address';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // HANDLE ADDRESS SUBMIT FUNCTION - This was missing
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (validateAddress()) {
      setPaymentStep('review');
    }
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
    if (addressErrors[name]) {
      setAddressErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      toast.error('Please fix address errors');
      return;
    }

    setProcessing(true);

    try {
      // Get or save shipping address
      let shippingAddress;
      if (useNewAddress) {
        // Combine house number with street if provided
        const fullAddress = {
          ...newAddress,
          street: newAddress.houseNumber 
            ? `${newAddress.houseNumber} ${newAddress.street}`
            : newAddress.street
        };
        
        const addressResponse = await orderService.addAddress(fullAddress);
        shippingAddress = addressResponse.address;
      } else {
        shippingAddress = addresses.find(addr => addr._id === selectedAddress);
      }

      // Calculate totals - REMOVED VAT, ADDED FLAT SHIPPING, REMOVED COD FEE
      const cartTotal = getCartTotal();
      const taxAmount = 0; // VAT removed
      const shippingCost = shippingFee; // Fixed shipping fee
      const codFee = 0; // COD removed
      const grandTotal = cartTotal + taxAmount + shippingCost;
      
      // IMPORTANT: Get user ID properly
      const userId = user?.id || user?.userId || user?._id;
      
      if (!userId) {
        toast.error('User not authenticated');
        setProcessing(false);
        return;
      }

      // Prepare order data
      const orderData = {
        userId: userId,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity
        })),
        totalAmount: cartTotal,
        taxAmount: taxAmount, // 0
        shippingCost: shippingCost, // Fixed fee
        grandTotal: grandTotal,
        shippingAddress: shippingAddress,
        paymentMethod: 'stripe', // Stripe only now
        customerEmail: user?.email
      };

      // Create order
      const orderResponse = await orderService.createOrder(orderData);
      
      // Only Stripe payment now
      if (orderResponse.checkoutUrl) {
        // Redirect to Stripe checkout session
        window.location.href = orderResponse.checkoutUrl;
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error) {
      toast.error(error.error || 'Failed to place order');
      setProcessing(false);
    }
  };

  // Progress Steps
  const steps = [
    { key: 'address', label: 'Address', icon: <FaMapMarkerAlt /> },
    { key: 'review', label: 'Review', icon: <FaShoppingBag /> },
    { key: 'payment', label: 'Payment', icon: <FaCreditCard /> }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading checkout..." />;
  }

  const cartTotal = getCartTotal();
  const taxAmount = 0; // VAT removed
  const shippingCost = shippingFee; // Fixed shipping fee
  const codFee = 0; // COD removed
  const grandTotal = cartTotal + taxAmount + shippingCost;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container className="py-4">
      {/* Progress Bar */}
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-3">
            <h4>Checkout Process</h4>
          </div>
          <ProgressBar className="mb-4">
            {steps.map((step, index) => (
              <ProgressBar 
                key={step.key}
                now={steps.findIndex(s => s.key === paymentStep) >= index ? 100 : 0}
                variant="primary"
                label={
                  <div className="text-center">
                    {step.icon}<br />
                    {step.label}
                  </div>
                }
                style={{ height: '80px' }}
              />
            ))}
          </ProgressBar>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Address Step */}
          // Checkout.jsx - Complete updated version

{paymentStep === 'address' && (
  <Card className="mb-4">
    <Card.Body>
      <Card.Title className="mb-4">
        <FaMapMarkerAlt className="me-2" />
        Shipping Address
      </Card.Title>
      
      {addresses.length > 0 && !useNewAddress && (
        <div>
          <h6>Select an existing address:</h6>
          <Form.Select 
            value={selectedAddress} 
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="mb-3"
            isInvalid={!!addressErrors.address}
          >
            <option value="">Select an address</option>
            {addresses.map(address => (
              <option key={address._id} value={address._id}>
                {address.name}: {address.street}, {address.city}, {address.postcode}
              </option>
            ))}
          </Form.Select>
          {addressErrors.address && (
            <div className="text-danger small mb-3">{addressErrors.address}</div>
          )}
          
          {/* Show selected address details */}
          {selectedAddress && (
            <Card className="mb-4 border-primary">
              <Card.Body>
                <h6>Selected Address:</h6>
                {(() => {
                  const selected = addresses.find(addr => addr._id === selectedAddress);
                  return selected ? (
                    <div>
                      <p className="mb-1"><strong>{selected.name}</strong></p>
                      <p className="mb-1">{selected.street}</p>
                      <p className="mb-1">{selected.city}, {selected.county}</p>
                      <p className="mb-1">{selected.postcode}</p>
                      <p className="mb-0">{selected.country}</p>
                      <p className="mb-0"><small>Phone: {selected.phone}</small></p>
                    </div>
                  ) : null;
                })()}
              </Card.Body>
            </Card>
          )}
          
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="outline-primary" 
              onClick={() => setUseNewAddress(true)}
            >
              Use a different address
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                if (!selectedAddress) {
                  setAddressErrors({ address: 'Please select a shipping address' });
                } else {
                  setPaymentStep('review');
                }
              }}
              disabled={!selectedAddress}
            >
              Continue to Review
            </Button>
          </div>
        </div>
      )}
      
      {useNewAddress && (
        <Form onSubmit={handleAddressSubmit}>
          <h6 className="mb-3">
            {addresses.length > 0 ? 'Enter a new delivery address:' : 'Enter delivery address:'}
          </h6>
          
          {/* ... [rest of new address form remains the same] ... */}
          
          <div className="d-flex justify-content-between">
            {addresses.length > 0 && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setUseNewAddress(false)}
              >
                Back to saved addresses
              </Button>
            )}
            <Button type="submit" variant="primary">
              Continue to Review
            </Button>
          </div>
        </Form>
      )}
    </Card.Body>
  </Card>
)}

          {/* Review Step - UPDATED to remove payment method selection */}
          {paymentStep === 'review' && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title className="mb-4">
                  <FaShoppingBag className="me-2" />
                  Review Your Order
                </Card.Title>

                {/* Order Summary */}
                <div className="mb-4">
                  <h6>Order Items ({totalItems}):</h6>
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={item.product?.image?.data 
                                  ? `data:${item.product.image.contentType};base64,${item.product.image.data}`
                                  : 'https://via.placeholder.com/40x40?text=Product'}
                                alt={item.product?.name}
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                className="rounded me-2"
                              />
                              <span>{item.product?.name}</span>
                            </div>
                          </td>
                          <td>{formatPrice(item.product?.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.product?.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Shipping Address Review */}
                <div className="mb-4 p-3 border rounded">
                  <h6>Delivery Address:</h6>
                  {useNewAddress ? (
                    <div>
                      <p className="mb-1"><strong>{newAddress.name}</strong></p>
                      <p className="mb-1">
                        {newAddress.houseNumber && `${newAddress.houseNumber} `}
                        {newAddress.street}
                      </p>
                      <p className="mb-1">{newAddress.city}, {newAddress.county}</p>
                      <p className="mb-1">{newAddress.postcode}</p>
                      <p className="mb-0">{newAddress.country}</p>
                      <p className="mb-0"><small>Phone: {newAddress.phone}</small></p>
                    </div>
                  ) : (
                    addresses.find(addr => addr._id === selectedAddress) && (
                      <div>
                        <p className="mb-1"><strong>{addresses.find(addr => addr._id === selectedAddress).name}</strong></p>
                        <p className="mb-1">{addresses.find(addr => addr._id === selectedAddress).street}</p>
                        <p className="mb-1">{addresses.find(addr => addr._id === selectedAddress).city}, {addresses.find(addr => addr._id === selectedAddress).county}</p>
                        <p className="mb-1">{addresses.find(addr => addr._id === selectedAddress).postcode}</p>
                        <p className="mb-0">{addresses.find(addr => addr._id === selectedAddress).country}</p>
                        <p className="mb-0"><small>Phone: {addresses.find(addr => addr._id === selectedAddress).phone}</small></p>
                      </div>
                    )
                  )}
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setPaymentStep('address')}
                  >
                    Change Address
                  </Button>
                </div>

                {/* Payment Information - UPDATED: Stripe only */}
                <div className="mb-4">
                  <h6>Payment Information:</h6>
                  <Alert variant="primary" className="border">
                    <div className="d-flex align-items-center">
                      <FaCreditCard className="me-3 fs-4" />
                      <div>
                        <strong>Credit/Debit Card Payment</strong>
                        <p className="mb-0 small">
                          You will be redirected to Stripe's secure payment page to complete your purchase.
                        </p>
                      </div>
                    </div>
                  </Alert>
                  
                  <Alert variant="info" className="border">
                    <div className="d-flex align-items-center">
                      <FaLock className="me-3 fs-4" />
                      <div>
                        <strong>Secure Payment</strong>
                        <p className="mb-0 small">
                          Your payment is processed securely by Stripe. We never store your card details.
                        </p>
                      </div>
                    </div>
                  </Alert>
                </div>

                <Alert variant="light" className="border mb-4">
                  <h6>Important Information:</h6>
                  <ul className="mb-0">
                    <li>Flat shipping fee: £{shippingFee.toFixed(2)}</li>
                    <li>Delivery: 3-5 working days</li>
                    <li>Secure payment via Stripe</li>
                    <li>14-day return policy</li>
                  </ul>
                </Alert>

                <div className="d-flex justify-content-between">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setPaymentStep('address')}
                  >
                    Back to Address
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handlePlaceOrder}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      `Proceed to Payment - ${formatPrice(grandTotal)}`
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {/* Order Summary Sidebar - UPDATED */}
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              
              <div className="mb-3">
                <h6>Items ({totalItems})</h6>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr>
                      <td>Subtotal</td>
                      <td className="text-end">{formatPrice(cartTotal)}</td>
                    </tr>
                    <tr>
                      <td>
                        <FaShippingFast className="me-1" />
                        Shipping
                      </td>
                      <td className="text-end">
                        {formatPrice(shippingCost)}
                        <div className="text-muted small">
                          Flat rate
                        </div>
                      </td>
                    </tr>
                    {/* COD Fee removed */}
                    <tr className="border-top">
                      <td><strong>Total</strong></td>
                      <td className="text-end">
                        <strong className="h5">{formatPrice(grandTotal)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              
              <Alert variant="info" className="small">
                <strong>Payment Information:</strong>
                <ul className="mb-0 mt-2">
                  <li>Pay with Visa, MasterCard, or other major cards</li>
                  <li>Secure payment via Stripe</li>
                  <li>No card details stored on our servers</li>
                </ul>
              </Alert>
              
              <div className="text-center small text-muted mt-3">
                <FaLock className="me-1" />
                Secure checkout powered by Stripe
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Processing Modal */}
      <Modal show={processing} centered backdrop="static" keyboard={false}>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Processing Your Order</h5>
          <p className="text-muted">Preparing secure payment session...</p>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Checkout;
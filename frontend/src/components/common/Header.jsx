import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  Container, Nav, Navbar, NavDropdown, Badge, 
  Button, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { 
  FaShoppingCart, FaUser, FaSignOutAlt, FaBox, 
  FaTachometerAlt, FaHome, FaTags,
  FaBell, FaShoppingBag, FaBars, FaTimes,
  FaHeart, FaCrown, FaGift, FaStore
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount, cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartPreview, setCartPreview] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setExpanded(false);
  };

  const cartCount = getCartCount();
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const navLinks = [
    { path: '/', label: 'Home', icon: <FaHome />, exact: true },
    { path: '/products', label: 'Shop', icon: <FaShoppingBag /> },
    { path: '/categories', label: 'Categories', icon: <FaTags /> },
  ];

  return (
    <>
      {/* Top Announcement Bar - Black Theme */}
      <div className="announcement-bar bg-black">
        <Container className="text-center py-2">
          <small className="text-white fw-bold">
            ✨ FREE SHIPPING ON ALL ORDERS • 🔥 LIMITED TIME OFFERS • ⭐ PREMIUM QUALITY
          </small>
        </Container>
      </div>

      {/* Main Navigation */}
      <Navbar 
        bg={scrolled ? 'dark' : 'black'} 
        variant="dark" 
        expand="lg" 
        expanded={expanded}
        onToggle={setExpanded}
        fixed="top"
        className={`main-navbar ${scrolled ? 'navbar-shadow' : ''} ${expanded ? 'navbar-expanded' : ''}`}
      >
        <Container fluid="xl">
          {/* Logo */}
          <Navbar.Brand 
            as={Link} 
            to="/" 
            onClick={() => setExpanded(false)}
            className="brand-logo"
          >
            <div className="logo-container">
              <FaStore className="logo-icon" />
              <div className="logo-text">
                <span className="logo-main">KATYANI</span>
                <span className="logo-sub">LUXURY</span>
              </div>
            </div>
          </Navbar.Brand>

          {/* Mobile Menu Toggle */}
          <Button
            variant="outline-light"
            className="d-lg-none mobile-menu-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <FaTimes /> : <FaBars />}
          </Button>

          <Navbar.Collapse id="navbar-nav">
            {/* Navigation Links */}
            <Nav className="mx-auto main-nav-links">
              {navLinks.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={link.path}
                  onClick={() => setExpanded(false)}
                  className={`nav-link-item ${location.pathname === link.path ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">{link.icon}</span>
                  <span className="nav-link-text">{link.label}</span>
                  {link.badge && (
                    <Badge pill bg="danger" className="link-badge">
                      {link.badge}
                    </Badge>
                  )}
                  {location.pathname === link.path && <span className="nav-indicator" />}
                </Nav.Link>
              ))}
            </Nav>

            {/* Action Icons */}
            <Nav className="action-icons">
          

              {/* Cart with Preview */}
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>Cart</Tooltip>}
              >
                <div 
                  className="cart-container"
                  onMouseEnter={() => setCartPreview(true)}
                  onMouseLeave={() => setCartPreview(false)}
                >
                  <Nav.Link 
                    as={Link} 
                    to="/cart" 
                    onClick={() => setExpanded(false)}
                    className="action-icon cart-icon"
                  >
                    <FaShoppingCart />
                    {cartCount > 0 && (
                      <Badge pill bg="danger" className="icon-badge">
                        {cartCount}
                      </Badge>
                    )}
                  </Nav.Link>

                  {/* Cart Preview Dropdown */}
                  {cartPreview && cartCount > 0 && (
                    <div className="cart-preview">
                      <div className="cart-preview-header">
                        <h6 className="mb-0">Your Cart ({cartCount} items)</h6>
                      </div>
                      <div className="cart-preview-items">
                        {cartItems.slice(0, 3).map((item, index) => (
                          <div key={index} className="cart-preview-item">
                            <img 
                              src={item.product.image?.data 
                                ? `data:${item.product.image.contentType};base64,${item.product.image.data}`
                                : 'https://via.placeholder.com/40x40?text=Product'
                              } 
                              alt={item.product.name}
                              className="cart-preview-image"
                            />
                            <div className="cart-preview-details">
                              <div className="cart-preview-name">{item.product.name}</div>
                              <div className="cart-preview-quantity">Qty: {item.quantity}</div>
                            </div>
                            <div className="cart-preview-price">
                              £{(item.product.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="cart-preview-footer">
                        <div className="cart-preview-total">
                          <span>Subtotal:</span>
                          <strong>£{cartTotal.toFixed(2)}</strong>
                        </div>
                        <Button 
                          variant="dark" 
                          size="sm" 
                          className="w-100 mt-2 checkout-btn"
                          onClick={() => {
                            navigate('/cart');
                            setCartPreview(false);
                            setExpanded(false);
                          }}
                        >
                          View Cart & Checkout
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </OverlayTrigger>

              {/* Notifications */}
              {isAuthenticated && (
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Notifications</Tooltip>}
                >
                  <Nav.Link 
                    as={Link} 
                    to="/notifications" 
                    onClick={() => setExpanded(false)}
                    className="action-icon"
                  >
                    <FaBell />
                    <Badge bg="warning" className="icon-badge">0</Badge>
                  </Nav.Link>
                </OverlayTrigger>
              )}

              {/* User Profile */}
              {isAuthenticated ? (
                <NavDropdown
                  title={
                    <div className="user-profile">
                      <div className="user-avatar">
                        {user?.firstName?.[0]}{user?.lastName?.[0] || 'U'}
                      </div>
                      <div className="user-info">
                        <div className="user-name">
                          {user?.firstName || 'User'}
                        </div>
                        <div className="user-role">
                          {user?.isAdmin ? 'Admin' : 'Member'}
                        </div>
                      </div>
                    </div>
                  }
                  id="user-dropdown"
                  align="end"
                  className="user-dropdown"
                >
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user?.firstName?.[0]}{user?.lastName?.[0] || 'U'}
                    </div>
                    <div className="dropdown-user-info">
                      <strong>{user?.firstName} {user?.lastName}</strong>
                      <small>{user?.email}</small>
                    </div>
                  </div>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                    <FaUser className="me-2" /> My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/orders" onClick={() => setExpanded(false)}>
                    <FaBox className="me-2" /> My Orders
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/wishlist" onClick={() => setExpanded(false)}>
                    <FaHeart className="me-2" /> Wishlist
                  </NavDropdown.Item>
                  
                  {user?.isAdmin && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/admin" onClick={() => setExpanded(false)}>
                        <MdDashboard className="me-2" /> Admin Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/products" onClick={() => setExpanded(false)}>
                        <FaShoppingBag className="me-2" /> Products
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/orders" onClick={() => setExpanded(false)}>
                        <FaBox className="me-2" /> Orders
                      </NavDropdown.Item>
                    </>
                  )}
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="logout-item">
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="auth-buttons">
                  <Button 
                    variant="outline-light" 
                    as={Link} 
                    to="/login" 
                    onClick={() => setExpanded(false)}
                    className="auth-btn"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="light" 
                    as={Link} 
                    to="/register" 
                    onClick={() => setExpanded(false)}
                    className="auth-btn register-btn"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="navbar-spacer" />
    </>
  );
};

export default Header;
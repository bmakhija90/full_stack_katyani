import React, { useState } from 'react';
import { Container, Row, Col, Modal, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaLock, FaShieldAlt,
  FaRegCreditCard, FaTruck, FaUndo, FaHeart, FaRocket,
  FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcAmazonPay, FaApplePay,
  FaGooglePay, FaCopyright, FaRegNewspaper, FaFileContract,
  FaQuestionCircle, FaHeadset, FaStar
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      // Simulate API call
      setTimeout(() => {
        setSubscribed(true);
        setNewsletterEmail('');
        setTimeout(() => {
          setShowNewsletterModal(false);
          setSubscribed(false);
        }, 2000);
      }, 1000);
    }
  };

  return (
    <>
      {/* Main Footer */}
      <footer className="footer-main">
        {/* Newsletter Section */}
        

        {/* Main Footer Content */}
        <Container>
          <Row>
            {/* Company Info */}
            <Col lg={3} md={6} className="mb-4">
              <div className="footer-brand">
                <div className="brand-logo">
                  <FaHeart className="brand-icon" />
                  <span className="brand-text">KATYANI<br /><span className="brand-subtext">LUXURY</span></span>
                </div>
                <p className="brand-tagline">
                  Elevating everyday luxury with premium quality products and exceptional service.
                </p>
                <div className="social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaFacebook />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaTwitter />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaInstagram />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaLinkedin />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaYoutube />
                  </a>
                </div>
              </div>
            </Col>

            {/* Quick Links */}
            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-title">Shop</h5>
              <ul className="footer-links">
                <li><Link to="/products" className="footer-link">All Products</Link></li>
              </ul>
            </Col>

            {/* Customer Service */}
            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-title">Support</h5>
              <ul className="footer-links">
                <li><button className="footer-link" onClick={() => setShowContactModal(true)}>Contact Us</button></li>
                <li><button className="footer-link" onClick={() => setShowShippingModal(true)}><FaTruck /> Shipping Info</button></li>
                <li><button className="footer-link" onClick={() => setShowReturnsModal(true)}><FaUndo /> Returns & Exchanges</button></li>
                <li><button className="footer-link" onClick={() => setShowPrivacyModal(true)}><FaLock /> Privacy Policy</button></li>
                <li><button className="footer-link" onClick={() => setShowTermsModal(true)}><FaFileContract /> Terms & Conditions</button></li>
                
              </ul>
            </Col>

            {/* Contact Info */}
            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-title">Contact</h5>
              <ul className="footer-contact">
                <li>
                  <FaMapMarkerAlt className="contact-icon" />
                  <div className="contact-info">
                    <strong>Address</strong>
                    <p>212 Brabazon Road<br />London, UK</p>
                  </div>
                </li>
                <li>
                  <FaPhone className="contact-icon" />
                  <div className="contact-info">
                    <strong>Phone</strong>
                    <p>+44 (0) 20 7123 4567</p>
                  </div>
                </li>
                <li>
                  <FaEnvelope className="contact-icon" />
                  <div className="contact-info">
                    <strong>Email</strong>
                    <p>support@kaytani.co.uk</p>
                  </div>
                </li>
                <li>
                  <FaHeadset className="contact-icon" />
                  <div className="contact-info">
                    <strong>Support Hours</strong>
                    <p>Mon-Fri: 9AM-6PM<br />Sat: 10AM-4PM</p>
                  </div>
                </li>
              </ul>
            </Col>

            {/* Payment Methods */}
            <Col lg={3} md={6} className="mb-4">
              <h5 className="footer-title">We Accept</h5>
              <div className="payment-methods">
                <div className="payment-icons">
                  <FaCcVisa className="payment-icon" />
                  <FaCcMastercard className="payment-icon" />
                  <FaCcPaypal className="payment-icon" />
                  <FaCcAmazonPay className="payment-icon" />
                  <FaApplePay className="payment-icon" />
                  <FaGooglePay className="payment-icon" />
                </div>
                <div className="security-badge">
                  <FaShieldAlt className="security-icon" />
                  <div className="security-text">
                    <strong>100% Secure Payments</strong>
                    <p>Your payment information is protected with 256-bit SSL encryption</p>
                  </div>
                </div>
                <div className="trust-badges">
                  <div className="trust-badge">
                    <FaTruck />
                    <span>All Over UK Shipping</span>
                  </div>
                  <div className="trust-badge">
                    <FaUndo />
                    <span>7-Day Returns</span>
                  </div>
                  <div className="trust-badge">
                    <FaRegCreditCard />
                    <span>Secure Checkout</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <hr className="footer-divider" />

          {/* Bottom Footer */}
          <Row className="footer-bottom">
            <Col md={6}>
              <p className="copyright">
                <FaCopyright /> {new Date().getFullYear()} <strong>Katyani Luxury</strong>. All rights reserved.
              </p>
            </Col>
            <Col md={6}>
              <div className="footer-bottom-links">
                <button className="bottom-link" onClick={() => setShowPrivacyModal(true)}>
                  Privacy Policy
                </button>
                <button className="bottom-link" onClick={() => setShowTermsModal(true)}>
                  Terms of Service
                </button>
                <button className="bottom-link" onClick={() => setShowShippingModal(true)}>
                  Shipping Policy
                </button>
                <button className="bottom-link" onClick={() => setShowReturnsModal(true)}>
                  Return Policy
                </button>
                <Link to="/sitemap" className="bottom-link">
                  Sitemap
                </Link>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Back to Top Button */}
        <button 
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      </footer>

      {/* Privacy Policy Modal */}
      <Modal 
        show={showPrivacyModal} 
        onHide={() => setShowPrivacyModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header-dark">
          <Modal.Title>
            <FaLock className="me-2" />
            Privacy Policy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-dark">
          <div className="policy-content">
            <h5>Your Privacy Matters</h5>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h6>1. Information We Collect</h6>
            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
            
            <h6>2. How We Use Your Information</h6>
            <ul>
              <li>To process and fulfill your orders</li>
              <li>To communicate with you about orders, products, and promotions</li>
              <li>To improve our services and website</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
            
            <h6>3. Data Protection</h6>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.</p>
            
            <h6>4. Your Rights</h6>
            <p>You have the right to access, correct, or delete your personal information. Contact us at privacy@kaytani.co.uk for assistance.</p>
            
            <h6>5. Cookies</h6>
            <p>We use cookies to enhance your browsing experience. You can control cookie settings through your browser.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer-dark">
          <Button variant="outline-light" onClick={() => setShowPrivacyModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal 
        show={showTermsModal} 
        onHide={() => setShowTermsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header-dark">
          <Modal.Title>
            <FaFileContract className="me-2" />
            Terms & Conditions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-dark">
          <div className="policy-content">
            <h5>Terms of Service</h5>
            <p>By accessing and using Katyani Luxury, you accept and agree to be bound by these terms.</p>
            
            <h6>1. Account Registration</h6>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining account security.</p>
            
            <h6>2. Orders and Pricing</h6>
            <p>All orders are subject to availability. Prices are subject to change without notice.</p>
            
            <h6>3. Shipping & Delivery</h6>
            <p>Shipping times are estimates. We are not responsible for delays caused by third-party carriers.</p>
            
            <h6>4. Returns & Refunds</h6>
            <p>Returns must be made within 30 days of delivery. Items must be unused and in original packaging.</p>
            
            <h6>5. Intellectual Property</h6>
            <p>All content on this website is the property of Katyani Luxury and protected by copyright laws.</p>
            
            <h6>6. Limitation of Liability</h6>
            <p>Katyani Luxury shall not be liable for any indirect, incidental, or consequential damages.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer-dark">
          <Button variant="outline-light" onClick={() => setShowTermsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Shipping Policy Modal */}
      <Modal 
        show={showShippingModal} 
        onHide={() => setShowShippingModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header-dark">
          <Modal.Title>
            <FaTruck className="me-2" />
            Shipping Policy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-dark">
          <div className="policy-content">
            <h5>Shipping Information</h5>
            
            <div className="shipping-options">
              <div className="shipping-option">
                <h6><FaTruck /> Standard Shipping</h6>
                <p>£3.50 • 3-5 business days</p>
              </div>
             
            </div>
            
            <h6>Shipping Areas</h6>
            <p>We currently ship to all UK addresses. International shipping is not available at this time.</p>
            
            <h6>Processing Time</h6>
            <p>Orders are processed within 1-2 business days. You will receive a confirmation email with tracking information.</p>
            
            <h6>Delivery Issues</h6>
            <p>If you experience any issues with delivery, please contact our customer service team within 48 hours.</p>
            
           
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer-dark">
          <Button variant="outline-light" onClick={() => setShowShippingModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Returns Policy Modal */}
      <Modal 
        show={showReturnsModal} 
        onHide={() => setShowReturnsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header-dark">
          <Modal.Title>
            <FaUndo className="me-2" />
            Returns & Exchanges
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-dark">
          <div className="policy-content">
            <h5>Our Return Policy</h5>
            
            <div className="return-highlights">
              <div className="highlight">
                <div className="highlight-icon">7</div>
                <div className="highlight-text">
                  <strong>7-Day Returns</strong>
                  <p>From delivery date</p>
                </div>
              </div>
              <div className="highlight">
                <div className="highlight-icon">✓</div>
                <div className="highlight-text">
                  <strong>Free Returns</strong>
                  <p>On all UK orders</p>
                </div>
              </div>
              <div className="highlight">
                <div className="highlight-icon">£</div>
                <div className="highlight-text">
                  <strong>Full Refunds</strong>
                  <p>Within 5-7 days</p>
                </div>
              </div>
            </div>
            
            <h6>Return Conditions</h6>
            <ul>
              <li>Items must be unused and in original condition</li>
              <li>All original packaging and tags must be included</li>
              <li>Proof of purchase is required</li>
              <li>Personalized items cannot be returned</li>
            </ul>
            
            <h6>How to Return</h6>
            <ol>
              <li>Contact our customer service to initiate a return</li>
              <li>We'll email you a prepaid return label</li>
              <li>Package your item securely</li>
              <li>Drop off at any post office or schedule a pickup</li>
              <li>Once received, we'll process your refund</li>
            </ol>
            
            <h6>Exchanges</h6>
            <p>We offer exchanges for different sizes or colors, subject to availability.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer-dark">
          <Button variant="outline-light" onClick={() => setShowReturnsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Contact Modal */}
      <Modal 
        show={showContactModal} 
        onHide={() => setShowContactModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header-dark">
          <Modal.Title>
            <FaHeadset className="me-2" />
            Contact Us
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-dark">
          <Row>
            <Col md={6}>
              <div className="contact-info-modal">
                <h6>Customer Service</h6>
                <p><FaPhone className="me-2" /> +44 (0) 20 7123 4567</p>
                <p><FaEnvelope className="me-2" /> support@kaytani.co.uk</p>
                
                <h6 className="mt-4">Business Hours</h6>
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </Col>
            <Col md={6}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" placeholder="Your name" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="Your email" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control type="text" placeholder="Subject" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control as="textarea" rows={3} placeholder="Your message" />
                </Form.Group>
                <Button variant="light" className="w-100">
                  Send Message
                </Button>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      {/* Newsletter Success Modal */}
      <Modal 
        show={subscribed} 
        onHide={() => setSubscribed(false)}
        centered
        size="sm"
      >
        <Modal.Body className="text-center py-5 modal-body-dark">
          <div className="success-icon">✓</div>
          <h5 className="mt-3">Subscribed Successfully!</h5>
          <p className="text-muted">Thank you for subscribing to our newsletter.</p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Footer;
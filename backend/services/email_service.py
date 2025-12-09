import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import requests
from bson import ObjectId
import random
from datetime import timedelta

class EmailService:
    """Mailgun email service for order notifications"""
    
    def __init__(self):
        self.mailgun_domain = os.getenv('MAILGUN_DOMAIN')
        self.mailgun_api_key = os.getenv('MAILGUN_API_KEY')
        self.mailgun_base_url = f"https://api.mailgun.net/v3/{self.mailgun_domain}"
        self.from_email = os.getenv('MAIL_FROM', f'noreply@{self.mailgun_domain}')
        self.company_name = os.getenv('COMPANY_NAME', 'Kirtli London')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Email template names
        self.template_order_confirmation = 'order conformation'
        self.template_order_shipped = 'order-shipped'
        self.template_order_delivered = 'order-delivered'
        
        # Validate Mailgun configuration
        if not self.mailgun_domain or not self.mailgun_api_key:
            logging.warning("Mailgun configuration incomplete. Email service will not work.")
    
    def _send_email(self, to_email: str, subject: str, template_name: str, 
                   template_vars: Dict[str, Any]) -> bool:
        """
        Send email using Mailgun API
        """
        if not self.mailgun_domain or not self.mailgun_api_key:
            logging.error("Mailgun not configured")
            return False
        
        try:
            # Prepare email data
            email_data = {
                'from': f'{self.company_name} <{self.from_email}>',
                'to': to_email,
                'subject': subject,
                'template': template_name,
                'h:X-Mailgun-Variables': self._serialize_template_vars(template_vars)
            }
            
            # Send request to Mailgun
            response = requests.post(
                f"{self.mailgun_base_url}/messages",
                auth=('api', self.mailgun_api_key),
                data=email_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logging.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logging.error(f"Mailgun API error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logging.error(f"Failed to send email: {str(e)}")
            return False
    
    def _serialize_template_vars(self, template_vars: Dict[str, Any]) -> str:
        """
        Serialize template variables to JSON string
        """
        import json
        
        # Convert any non-serializable objects
        serializable_vars = {}
        for key, value in template_vars.items():
            if isinstance(value, (dict, list, str, int, float, bool, type(None))):
                serializable_vars[key] = value
            elif isinstance(value, datetime):
                serializable_vars[key] = value.isoformat()
            elif isinstance(value, ObjectId):
                serializable_vars[key] = str(value)
            else:
                serializable_vars[key] = str(value)
        
        return json.dumps(serializable_vars)
    
    def send_order_confirmation(self, order_data: Dict[str, Any], 
                               user_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Send order confirmation email
        """
        # Prepare template variables
        template_vars = self._prepare_order_confirmation_vars(order_data, user_data)
        
        subject = f"Order Confirmation - #{template_vars['orderNumber']}"
        
        return self._send_email(
            to_email=template_vars['customerEmail'],
            subject=subject,
            template_name=self.template_order_confirmation,
            template_vars=template_vars
        )
    
    def send_order_shipped(self, order_data: Dict[str, Any],
                          shipping_info: Dict[str, Any],
                          user_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Send order shipped notification email
        """
        template_vars = self._prepare_order_shipped_vars(order_data, shipping_info, user_data)
        
        subject = f"Your Order Has Been Shipped - #{template_vars['orderNumber']}"
        
        return self._send_email(
            to_email=template_vars['customerEmail'],
            subject=subject,
            template_name=self.template_order_shipped,
            template_vars=template_vars
        )
    
    def send_order_delivered(self, order_data: Dict[str, Any],
                            user_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Send order delivered notification email
        """
        template_vars = self._prepare_order_delivered_vars(order_data, user_data)
        
        subject = f"Your Order Has Been Delivered - #{template_vars['orderNumber']}"
        
        return self._send_email(
            to_email=template_vars['customerEmail'],
            subject=subject,
            template_name=self.template_order_delivered,
            template_vars=template_vars
        )
    
    def _prepare_order_confirmation_vars(self, order_data: Dict[str, Any],
                                        user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Prepare template variables for order confirmation email
        """
        # Extract order information
        order_id = str(order_data.get('_id', ''))
        order_date = order_data.get('createdAt', datetime.utcnow())
        
        # Prepare items list
        items = []
        for item in order_data['items']:
            items.append({
                'name': item['name'],
                'price': float(item['price']),
                'quantity': int(item.get('quantity', 1)),
                'variant': item.get('variant', item.get('size', '')),
                'subtotal': float(item['price']) * int(item.get('quantity', 1))
            })
        
        # Calculate subtotal from items if not provided
        subtotal = order_data.get('subtotal', sum(item.get('subtotal', 0) for item in items))
        
        # Prepare shipping address
        shipping_address = order_data.get('shippingAddress', {})
        if isinstance(shipping_address, dict):
            shipping_address = {
                'name': shipping_address.get('name', ''),
                'street': shipping_address.get('street', shipping_address.get('address1', '')),
                'city': shipping_address.get('city', ''),
                'state': shipping_address.get('state', shipping_address.get('province', '')),
                'country': shipping_address.get('country', 'UK'),
                'zipCode': shipping_address.get('zipCode', shipping_address.get('postalCode', '')),
                'phone': shipping_address.get('phone', ''),
                'email': shipping_address.get('email', '')
            }
        
        # Get user information
        if user_data:
            customer_name = f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}".strip()
            customer_email = user_data.get('email', '')
        else:
            customer_name = order_data.get('customerName', '')
            customer_email = order_data.get('customerEmail', '')
        
        # Get order status URL
        order_status_url = f"{self.frontend_url}/orders/{order_id}"
        
        # Prepare template variables
        template_vars = {
            # Order Information
            'orderNumber': f"ORD-{order_id[-8:].upper()}" if len(order_id) >= 8 else f"ORD-{order_id.upper()}",
            'orderDate': order_date.isoformat() if isinstance(order_date, datetime) else str(order_date),
            'orderStatus': order_data.get('orderStatus', 'confirmed').capitalize(),
            'paymentStatus': order_data.get('paymentStatus', 'paid').capitalize(),
            'orderStatusUrl': order_status_url,
            
            # Customer Information
            'customerName': customer_name,
            'customerEmail': customer_email,
            
            # Order Items
            'items': items,
            'subtotal': float(subtotal),
            'shippingCost': float(order_data.get('shippingCost', 0)),
            'taxAmount': float(order_data.get('taxAmount', 0)),
            'discount': float(order_data.get('discount', 0)),
            'grandTotal': float(order_data.get('grandTotal', 0)),
            
            # Shipping Information
            'shippingAddress': shipping_address,
            'estimatedDelivery': self._get_estimated_delivery_date(),
            
            # Company Information
            'logoUrl': f"{self.frontend_url}/logo.png",  # Update with your actual logo URL
            'currentYear': datetime.now().year,
            'privacyPolicyUrl': f"{self.frontend_url}/privacy-policy",
            'unsubscribeUrl': f"{self.frontend_url}/unsubscribe",
            
            # Tracking (will be empty for confirmation)
            'trackingNumber': '',
            'trackingUrl': '',
            'courierName': ''
        }
        
        return template_vars
    
    def _prepare_order_shipped_vars(self, order_data: Dict[str, Any],
                                   shipping_info: Dict[str, Any],
                                   user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Prepare template variables for order shipped email
        """
        # Get base confirmation variables
        template_vars = self._prepare_order_confirmation_vars(order_data, user_data)
        
        # Update with shipping information
        template_vars.update({
            'orderStatus': 'Shipped',
            'trackingNumber': shipping_info.get('trackingNumber', ''),
            'trackingUrl': shipping_info.get('trackingUrl', ''),
            'courierName': shipping_info.get('courierName', ''),
            'estimatedDelivery': shipping_info.get('estimatedDelivery', 
                                                 self._get_estimated_delivery_date(shipped=True))
        })
        
        return template_vars
    
    def _prepare_order_delivered_vars(self, order_data: Dict[str, Any],
                                     user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Prepare template variables for order delivered email
        """
        # Get base confirmation variables
        template_vars = self._prepare_order_confirmation_vars(order_data, user_data)
        
        # Update for delivered status
        template_vars.update({
            'orderStatus': 'Delivered',
            'trackingNumber': order_data.get('shippingInfo', {}).get('trackingNumber', ''),
            'trackingUrl': order_data.get('shippingInfo', {}).get('trackingUrl', ''),
            'courierName': order_data.get('shippingInfo', {}).get('courierName', ''),
            'estimatedDelivery': 'Delivered'
        })
        
        return template_vars
    
    def _get_estimated_delivery_date(self, shipped: bool = False) -> str:
        """
        Calculate estimated delivery date
        """
        from datetime import datetime, timedelta
        
        today = datetime.now()
        if shipped:
            # If already shipped, estimate 3-7 business days
            delivery_date = today + timedelta(days=random.randint(3, 7))
        else:
            # If just ordered, estimate 5-10 business days
            delivery_date = today + timedelta(days=random.randint(5, 10))
        
        return delivery_date.strftime('%B %d, %Y')
    
    @staticmethod
    def test_mailgun_connection() -> Dict[str, Any]:
        """
        Test Mailgun API connection
        """
        service = EmailService()
        
        if not service.mailgun_domain or not service.mailgun_api_key:
            return {
                'status': 'error',
                'message': 'Mailgun configuration missing'
            }
        
        try:
            # Test API by checking domain
            response = requests.get(
                f"https://api.mailgun.net/v3/domains/{service.mailgun_domain}",
                auth=('api', service.mailgun_api_key),
                timeout=5
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'message': 'Mailgun API is working',
                    'domain': service.mailgun_domain
                }
            else:
                return {
                    'status': 'error',
                    'message': f'Mailgun API error: {response.status_code}',
                    'details': response.text
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to connect to Mailgun: {str(e)}'
            }


# Create singleton instance
email_service = EmailService()
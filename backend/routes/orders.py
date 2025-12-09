from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required, admin_required
from models.order import OrderModel
from datetime import datetime
from bson import ObjectId
import stripe
import os
from flask import current_app
from flask_cors import cross_origin
from services.email_service import email_service



orders_bp = Blueprint('orders', __name__)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# orders.py - Updated create_order function (removed COD logic)

@orders_bp.route('/orders', methods=['POST'])
@token_required
def create_order():
    try:
        data = request.json
        
        # Log incoming data for debugging
        current_app.logger.info(f'Creating order for user {request.user_id}')
        current_app.logger.debug(f'Order data: {data}')
        
        # Validate order data
        from utils.validators import validate_order_data
        is_valid, message = validate_order_data(data)
        if not is_valid:
            current_app.logger.error(f'Validation failed: {message}')
            return jsonify({'error': message}), 400
        
        # Get configurable shipping fee from environment (default 3.5 GBP)
        configurable_shipping_fee = float(os.getenv('SHIPPING_FEE_GBP', 3.5))
        
        # Create order in database
        order_data = {
            'userId': ObjectId(request.user_id),  # Ensure ObjectId
            'items': data['items'],
            'totalAmount': data['totalAmount'],
            'taxAmount': 0,  # VAT removed
            'shippingCost': configurable_shipping_fee,  # Fixed shipping fee
            'grandTotal': float(data['totalAmount']) + configurable_shipping_fee,  # Total + shipping
            'shippingAddress': data['shippingAddress'],
            'paymentMethod': 'stripe',  # Stripe only now
            'paymentStatus': 'pending',
            'orderStatus': 'pending',
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'customerEmail': data.get('customerEmail'),
            'customerName': data.get('customerName', ''),
            'shippingFeeConfig': configurable_shipping_fee  # Store the shipping fee used
        }
        
        order_id = OrderModel.create_order(request.db, order_data)
        
        # REMOVED: COD logic - only Stripe payments now
        
        # Create Stripe checkout session
        try:
            # Create line items for Stripe - FIXED unit_amount calculation
            line_items = []
            for item in data['items']:
                # Ensure price is in pence (lowest currency unit)
                unit_amount = int(float(item['price']) * 100)
                if unit_amount < 50:  # Stripe minimum is 50 cents/pence
                    unit_amount = 50
                
                line_items.append({
                    'price_data': {
                        'currency': 'gbp',
                        'product_data': {
                            'name': item['name'],
                            'metadata': {
                                'product_id': str(item.get('productId', ''))
                            }
                        },
                        'unit_amount': unit_amount,
                    },
                    'quantity': item['quantity'],
                })
            
            # Add fixed shipping cost
            shipping_amount = int(configurable_shipping_fee * 100)
            if shipping_amount < 50:
                shipping_amount = 50
            
            line_items.append({
                'price_data': {
                    'currency': 'gbp',
                    'product_data': {
                        'name': 'Shipping Fee',
                        'description': f'Standard delivery (£{configurable_shipping_fee})'
                    },
                    'unit_amount': shipping_amount,
                },
                'quantity': 1,
            })
            
            # Debug log
            current_app.logger.info(f'Creating Stripe checkout with {len(line_items)} line items')
            current_app.logger.debug(f'Line items: {line_items}')
            
            # Create Stripe Checkout Session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f'{FRONTEND_URL}/order-success/{order_id}?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{FRONTEND_URL}/checkout?canceled=true',
                client_reference_id=str(order_id),
                customer_email=data.get('customerEmail'),
                metadata={
                    'orderId': str(order_id),
                    'userId': str(request.user_id),
                },
                # Shipping address collection
                shipping_address_collection={
                    'allowed_countries': ['GB'],
                },
                # Billing address
                billing_address_collection='required',
                # Shipping options
                shipping_options=[
                    {
                        'shipping_rate_data': {
                            'type': 'fixed_amount',
                            'fixed_amount': {
                                'amount': shipping_amount,
                                'currency': 'gbp',
                            },
                            'display_name': f'Standard Shipping (£{configurable_shipping_fee})',
                            'delivery_estimate': {
                                'minimum': {
                                    'unit': 'business_day',
                                    'value': 3,
                                },
                                'maximum': {
                                    'unit': 'business_day',
                                    'value': 5,
                                },
                            },
                        },
                    },
                ],
            )
            
            current_app.logger.info(f'Stripe checkout created: {checkout_session.id}')
            
            return jsonify({
                'message': 'Order created successfully',
                'orderId': str(order_id),
                'paymentMethod': 'stripe',
                'paymentStatus': 'pending',
                'checkoutUrl': checkout_session.url,
                'sessionId': checkout_session.id,
                'shippingFee': configurable_shipping_fee
            }), 201
            
        except stripe.error.StripeError as stripe_error:
            # Log Stripe error details
            current_app.logger.error(f'Stripe API error: {stripe_error}')
            current_app.logger.error(f'Stripe error type: {type(stripe_error)}')
            current_app.logger.error(f'Stripe error user message: {stripe_error.user_message if hasattr(stripe_error, "user_message") else "N/A"}')
            
            # If Stripe fails, mark order as failed
            OrderModel.update_order_payment_status(request.db, order_id, 'failed')
            return jsonify({
                'error': 'Payment processing failed',
                'stripe_error': str(stripe_error),
                'orderId': str(order_id),
                'paymentMethod': 'stripe',
                'paymentStatus': 'failed'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f'Order creation error: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


@orders_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        days = int(request.args.get('days', 7))
        stats = OrderModel.get_dashboard_stats(request.db)
        return jsonify(stats), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching dashboard stats: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
# Add this endpoint to check Stripe connectivity
@orders_bp.route('/stripe/health', methods=['GET'])
def stripe_health_check():
    """Check if Stripe API is working"""
    try:
        # Try to create a simple test payment intent
        test_intent = stripe.PaymentIntent.create(
            amount=100,  # £1.00
            currency='gbp',
            payment_method_types=['card'],
            metadata={'test': 'true'}
        )
        
        return jsonify({
            'status': 'healthy',
            'stripe_api': 'working',
            'test_intent_id': test_intent.id
        }), 200
        
    except stripe.error.AuthenticationError:
        return jsonify({
            'status': 'unhealthy',
            'error': 'Stripe authentication failed - check API key'
        }), 500
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@orders_bp.route('/orders/<order_id>/confirm-stripe', methods=['POST'])
@token_required
def confirm_stripe_payment(order_id):
    try:
        data = request.json
        
        if 'sessionId' not in data:
            return jsonify({'error': 'Session ID required'}), 400
        
        # Verify payment with Stripe
        session = stripe.checkout.Session.retrieve(data['sessionId'])
        
        if session.payment_status == 'paid':
            # Update order status
            OrderModel.update_order_payment_status(request.db, order_id, 'completed')
            OrderModel.update_order_status(request.db, order_id, 'processing')
            
            # Get customer details from Stripe
            customer = stripe.Customer.retrieve(session.customer) if session.customer else None
            
            return jsonify({
                'message': 'Payment confirmed successfully',
                'orderId': order_id,
                'paymentStatus': 'completed',
                'customer': {
                    'id': customer.id if customer else None,
                    'email': customer.email if customer else None,
                } if customer else None
            }), 200
        else:
            return jsonify({
                'error': 'Payment not successful',
                'paymentStatus': session.payment_status
            }), 400
            
    except Exception as e:
        current_app.logger.error(f'Payment confirmation error: {e}')
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/stripe/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Update order status in database
        order_id = session.metadata.get('orderId')
        user_id = session.metadata.get('userId')
        
        if order_id:
            OrderModel.update_order_payment_status(request.db, order_id, 'completed')
            OrderModel.update_order_status(request.db, order_id, 'processing')
            
            # Clear user's cart
            request.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'cart': []}}
            )
    
    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        order_id = session.metadata.get('orderId')
        
        if order_id:
            OrderModel.update_order_payment_status(request.db, order_id, 'failed')
    
    return jsonify({'success': True}), 200

# Add this method to update order status
@orders_bp.route('/orders/<order_id>/status', methods=['PUT'])
@token_required
@admin_required  # Only admins can update order status
def update_order_status(order_id):
    try:
        data = request.json
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Validate shipping info if status is shipped
        shipping_info = None
        if data['status'] == 'shipped':
            shipping_info = data.get('shippingInfo')
            if not shipping_info:
                return jsonify({'error': 'Shipping information is required for shipped status'}), 400
            
            # Validate required fields
            if 'courierName' not in shipping_info or not shipping_info['courierName'].strip():
                return jsonify({'error': 'Courier company name is required'}), 400
            
            if 'trackingNumber' not in shipping_info or not shipping_info['trackingNumber'].strip():
                return jsonify({'error': 'Tracking number is required'}), 400
        
        # Update order status with shipping info if provided
        OrderModel.update_order_status(
            db=request.db, 
            order_id=order_id, 
            order_status=data['status'],
            shipping_info=shipping_info
        )
        
        # If order is shipped, send notification email (optional)
        if data['status'] == 'shipped' and shipping_info:
            try:
                # Get order details
                order = request.db.orders.find_one({'_id': ObjectId(order_id)})
                if order and order.get('customerEmail'):
                    # Here you would implement email notification
                    # Example: send_shipped_email(order, shipping_info)
                    current_app.logger.info(f'Order {order_id} shipped with tracking {shipping_info.get("trackingNumber")}')
            except Exception as email_error:
                current_app.logger.error(f'Error logging shipment: {email_error}')
        
        return jsonify({
            'message': 'Order status updated successfully',
            'status': data['status'],
            'shippingInfo': shipping_info if shipping_info else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error updating order status: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


# orders.py - Add these endpoints

@orders_bp.route('/orders/<order_id>/success', methods=['POST'])
@token_required
def confirm_order_success(order_id):
    """Confirm order after Stripe payment success"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        # Verify the Stripe session
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            # Update order status
            db = request.db
            
            # Update order payment status
            db.orders.update_one(
                {'_id': ObjectId(order_id)},
                {
                    '$set': {
                        'paymentStatus': 'paid',
                        'orderStatus': 'processing',
                        'stripeSessionId': session_id,
                        'stripePaymentIntentId': session.payment_intent,
                        'updatedAt': datetime.utcnow()
                    }
                }
            )
            
            # Get user ID from order
            order = db.orders.find_one({'_id': ObjectId(order_id)})
            user_id = order.get('userId')
            current_app.logger.info(f'Order {order_id} payment confirmed for user {user_id}')
            user = request.db.users.find_one({'_id': ObjectId(request.user_id)})
            if order and user:
                email_sent = email_service.send_order_confirmation(order, user)
                if email_sent:
                    current_app.logger.info(f'Order confirmation email sent for order {order_id}')
                else:
                    current_app.logger.error(f'Failed to send order confirmation email for order {order_id}')

            # Clear user's cart
            if user_id:
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'cart': []}}
                )
            
            return jsonify({
                'success': True,
                'message': 'Order confirmed successfully',
                'orderId': order_id,
                'paymentStatus': 'paid'
            }), 200
        else:
            return jsonify({
                'error': 'Payment not completed',
                'paymentStatus': session.payment_status
            }), 400
            
    except stripe.error.StripeError as e:
        current_app.logger.error(f'Stripe error in order confirmation: {e}')
        return jsonify({'error': 'Payment verification failed'}), 500
    except Exception as e:
        current_app.logger.error(f'Error confirming order: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@orders_bp.route('/orders/<order_id>', methods=['GET'])
@token_required
def get_order_by_id(order_id):
    """Get order details by ID"""
    try:
        order = request.db.orders.find_one({'_id': ObjectId(order_id)})
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if user is authorized to view this order
        user_id = request.user_id
        if str(order['userId']) != str(user_id) and not request.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Convert to JSON-serializable format
        order['_id'] = str(order['_id'])
        order['userId'] = str(order['userId'])
        
        # Ensure shipping cost is included with default value
        if 'shippingCost' not in order:
            order['shippingCost'] = 3.5  # Default shipping fee
        
        if 'taxAmount' not in order:
            order['taxAmount'] = 0
        
        if 'grandTotal' not in order and 'totalAmount' in order:
            order['grandTotal'] = order['totalAmount'] + order.get('shippingCost', 3.5)
        
        # Convert dates
        for date_field in ['createdAt', 'updatedAt']:
            if date_field in order and isinstance(order[date_field], datetime):
                order[date_field] = order[date_field].isoformat()
        
        return jsonify(order), 200
        
    except Exception as e:
        current_app.logger.error(f'Error fetching order: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@orders_bp.route('/orders/<order_id>/details', methods=['GET'])
@token_required
def get_order_details(order_id):
    """Get detailed order information by ID with user authentication"""
    try:
        # Find the order
        order = request.db.orders.find_one({'_id': ObjectId(order_id)})
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if user is authorized to view this order
        user_id = request.user_id
        is_admin = getattr(request, 'is_admin', False)
        
        # Convert userId to string for comparison
        order_user_id = str(order['userId'])
        current_user_id = str(user_id)
        
        # Allow admin or the user who placed the order
        if order_user_id != current_user_id and not is_admin:
            return jsonify({'error': 'Unauthorized access to order'}), 403
        
        # Get user details
        user = request.db.users.find_one({'_id': ObjectId(order_user_id)})
        
        # Format the order data
        formatted_order = {
            '_id': str(order['_id']),
            'orderNumber': f"ORD-{str(order['_id'])[-8:].upper()}",
            'userId': order_user_id,
            'user': {
                'name': user.get('firstName', '') + ' ' + user.get('lastName', '') if user else '',
                'email': user.get('email', '') if user else '',
                'phone': user.get('phone', '') if user else ''
            } if user else None,
            'items': order.get('items', []),
            'totalAmount': float(order.get('totalAmount', 0)),
            'taxAmount': float(order.get('taxAmount', 0)),
            'shippingCost': float(order.get('shippingCost', 0)),
            'grandTotal': float(order.get('grandTotal', order.get('totalAmount', 0))),
            'shippingAddress': order.get('shippingAddress', {}),
            'paymentMethod': order.get('paymentMethod', 'stripe'),
            'paymentStatus': order.get('paymentStatus', 'pending'),
            'orderStatus': order.get('orderStatus', 'pending'),
            'stripePaymentId': order.get('stripePaymentId', ''),
            'stripeSessionId': order.get('stripeSessionId', ''),
            'createdAt': order.get('createdAt').isoformat() if order.get('createdAt') else None,
            'updatedAt': order.get('updatedAt').isoformat() if order.get('updatedAt') else None,
            'notes': order.get('notes', ''),
            'trackingNumber': order.get('trackingNumber', ''),
            'deliveryDate': order.get('deliveryDate', '')
        }
        
        return jsonify({
            'success': True,
            'order': formatted_order
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error fetching order details: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

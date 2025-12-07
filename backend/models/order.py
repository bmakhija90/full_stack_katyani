from datetime import datetime, timedelta
from bson import ObjectId

class OrderModel:
    @staticmethod
    def create_order(db, order_data):
        orders = db.orders
        order = {
            'userId': order_data['userId'],
            'items': order_data['items'],
            'totalAmount': float(order_data['totalAmount']),
            'taxAmount': float(order_data.get('taxAmount', 0)),  # Add taxAmount
            'shippingCost': float(order_data.get('shippingCost', 3.5)),  # Add shippingCost
            'grandTotal': float(order_data.get('grandTotal', 0)),  # Add grandTotal
            'shippingAddress': order_data['shippingAddress'],
            'paymentMethod': order_data.get('paymentMethod', 'stripe'),
            'paymentStatus': order_data.get('paymentStatus', 'pending'),
            'orderStatus': order_data.get('orderStatus', 'processing'),
            'stripePaymentId': order_data.get('stripePaymentId', ''),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'customerEmail': order_data.get('customerEmail'),  # Add customerEmail
            'customerName': order_data.get('customerName', ''),  # Add customerName
            'shippingFeeConfig': float(order_data.get('shippingCost', 3.5))  # Store shipping fee
        }
        result = orders.insert_one(order)
        return str(result.inserted_id)

    @staticmethod
    def get_user_orders(db, user_id, page=1, limit=10):
        try:
            orders = db.orders
            skip = (page - 1) * limit
            
            # Convert user_id to ObjectId if it's a string
            if isinstance(user_id, str):
                user_id_obj = ObjectId(user_id)
            else:
                user_id_obj = user_id
            
            # Debug: Print query
            print(f"Searching orders for user_id: {user_id}, type: {type(user_id_obj)}")
            
            # Count total orders for this user
            total = orders.count_documents({'userId': user_id_obj})
            
            # Debug: Print count
            print(f"Total orders found: {total}")
            
            # Fetch orders with pagination
            items_cursor = orders.find({'userId': user_id_obj})\
                                .sort('createdAt', -1)\
                                .skip(skip)\
                                .limit(limit)
            
            items = list(items_cursor)
            
            # Debug: Print fetched items
            print(f"Fetched {len(items)} orders")
            
            # Convert to serializable format
            for item in items:
                item['_id'] = str(item['_id'])
                # Convert userId to string if it's ObjectId
                if 'userId' in item and isinstance(item['userId'], ObjectId):
                    item['userId'] = str(item['userId'])
                
                # Convert datetime fields to ISO format
                for key in ['createdAt', 'updatedAt']:
                    if key in item and isinstance(item[key], datetime):
                        item[key] = item[key].isoformat()
                
                # Ensure items is a list
                if 'items' in item and not isinstance(item['items'], list):
                    item['items'] = []
            
            return {
                'orders': items,
                'total': total,
                'page': page,
                'limit': limit,
                'totalPages': (total + limit - 1) // limit  # Ceiling division
            }
            
        except Exception as e:
            print(f"Error in get_user_orders: {str(e)}")
            raise e

    @staticmethod
    def get_dashboard_stats(db, days=7):
        try:
            # Calculate date range
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # 1. Get total orders count
            total_orders = db.orders.count_documents({})
            
            # 2. Get recent orders count
            recent_orders = db.orders.count_documents({
                'createdAt': {'$gte': cutoff_date}
            })
            
            # 3. Get total revenue
            revenue_cursor = db.orders.aggregate([
                {'$match': {'createdAt': {'$gte': cutoff_date}}},
                {'$group': {'_id': None, 'total': {'$sum': '$grandTotal'}}}
            ])
            
            try:
                revenue_data = list(revenue_cursor)
                total_revenue = revenue_data[0]['total'] if revenue_data else 0
            except:
                total_revenue = 0
            
            # 4. Get pending orders count
            pending_orders = db.orders.count_documents({
                'orderStatus': 'pending'
            })
            
            # 5. Get completed orders count
            completed_orders = db.orders.count_documents({
                'orderStatus': 'completed'
            })
            
            # 6. Get recent orders with details (limit to 10)
            recent_orders_list = db.orders.find({
                'createdAt': {'$gte': cutoff_date}
            }).sort('createdAt', -1).limit(10)
            
            # Convert ObjectId to string and format dates
            formatted_recent_orders = []
            for order in recent_orders_list:
                # Create a new dict with serializable values
                formatted_order = {}
                for key, value in order.items():
                    if isinstance(value, ObjectId):
                        formatted_order[key] = str(value)
                    elif isinstance(value, datetime):
                        formatted_order[key] = value.isoformat()
                    elif key == '_id':
                        formatted_order[key] = str(value)
                    elif key == 'userId' and isinstance(value, ObjectId):
                        formatted_order[key] = str(value)
                    elif isinstance(value, dict) and '_id' in value and isinstance(value['_id'], ObjectId):
                        # Handle nested ObjectIds (like in shippingAddress if it has _id)
                        formatted_order[key] = {
                            k: str(v) if isinstance(v, ObjectId) else v 
                            for k, v in value.items()
                        }
                    else:
                        formatted_order[key] = value
                formatted_recent_orders.append(formatted_order)
            
            # 7. Get top selling products
            top_products_cursor = db.orders.aggregate([
                {'$unwind': '$items'},
                {'$group': {
                    '_id': '$items.productId',
                    'name': {'$first': '$items.name'},
                    'totalSold': {'$sum': '$items.quantity'},
                    'totalRevenue': {'$sum': {'$multiply': ['$items.price', '$items.quantity']}}
                }},
                {'$sort': {'totalSold': -1}},
                {'$limit': 5}
            ])
            
            top_products = []
            for product in top_products_cursor:
                product['_id'] = str(product['_id']) if isinstance(product['_id'], ObjectId) else product['_id']
                top_products.append(product)
            
            # 8. Get order status distribution
            status_distribution = db.orders.aggregate([
                {'$group': {
                    '_id': '$orderStatus',
                    'count': {'$sum': 1}
                }}
            ])
            
            status_data = {}
            for status in status_distribution:
                status_data[status['_id']] = status['count']
            
            # 9. Get daily revenue for chart
            daily_revenue_cursor = db.orders.aggregate([
                {'$match': {'createdAt': {'$gte': cutoff_date}}},
                {'$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$createdAt'
                        }
                    },
                    'revenue': {'$sum': '$grandTotal'},
                    'orders': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ])
            
            daily_revenue = []
            for day in daily_revenue_cursor:
                daily_revenue.append({
                    'date': day['_id'],
                    'revenue': day['revenue'],
                    'orders': day['orders']
                })
            
            # Return all stats
            return {
                'summary': {
                    'totalOrders': total_orders,
                    'recentOrders': recent_orders,
                    'totalRevenue': total_revenue,
                    'pendingOrders': pending_orders,
                    'completedOrders': completed_orders,
                    'averageOrderValue': total_revenue / recent_orders if recent_orders > 0 else 0
                },
                'recentOrders': formatted_recent_orders,
                'topProducts': top_products,
                'statusDistribution': status_data,
                'dailyRevenue': daily_revenue,
                'timeRange': {
                    'days': days,
                    'from': cutoff_date.isoformat(),
                    'to': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            # Note: current_app is not available here, use regular logging
            import logging
            logging.error(f'Error in get_dashboard_stats: {e}', exc_info=True)
            raise e

    @staticmethod
    def update_order_payment_status(db, order_id, payment_status):
        db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {
                '$set': {
                    'paymentStatus': payment_status,
                    'updatedAt': datetime.utcnow()
                }
            }
        )

    @staticmethod
    def update_order_status(db, order_id, order_status, shipping_info=None):
        """Update order status with optional shipping information"""
        update_data = {
            'orderStatus': order_status,
            'updatedAt': datetime.utcnow()
        }
        
        # If status is shipped and shipping info is provided, add it
        if order_status == 'shipped' and shipping_info:
            shipping_info['shippedAt'] = datetime.utcnow()
            update_data['shippingInfo'] = shipping_info
        
        db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': update_data}
        )
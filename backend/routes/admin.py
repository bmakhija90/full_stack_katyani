from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required, admin_required
from datetime import datetime, timedelta
from bson import ObjectId

admin_bp = Blueprint('admin', __name__)

def serialize_mongo_document(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if isinstance(doc, list):
        return [serialize_mongo_document(item) for item in doc]
    
    if not isinstance(doc, dict):
        return doc
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_mongo_document(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_mongo_document(item) for item in value]
        else:
            serialized[key] = value
    return serialized


@admin_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_required
def get_all_users():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    skip = (page - 1) * limit
    
    users = list(request.db.users.find(
        {},
        {'password': 0}
    ).skip(skip).limit(limit))
    
    total = request.db.users.count_documents({})
    
    for user in users:
        user['_id'] = str(user['_id'])
    
    return jsonify({
        'users': users,
        'total': total,
        'page': page,
        'limit': limit
    }), 200

@admin_bp.route('/admin/orders', methods=['GET'])
@token_required
@admin_required
def get_all_orders():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        # Get orders
        orders_cursor = request.db.orders.find().sort('createdAt', -1).skip(skip).limit(limit)
        orders = list(orders_cursor)
        total = request.db.orders.count_documents({})
        
        # Serialize all orders
        serialized_orders = serialize_mongo_document(orders)
        
        return jsonify({
            'orders': serialized_orders,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid page or limit parameter'}), 400
    except Exception as e:
        current_app.logger.error(f'Error fetching orders: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@admin_bp.route('/admin/orders/<order_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_order_status(order_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['processing', 'shipped', 'delivered', 'cancelled']
    if data['status'] not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    request.db.orders.update_one(
        {'_id': ObjectId(order_id)},
        {
            '$set': {
                'orderStatus': data['status'],
                'updatedAt': datetime.utcnow()
            }
        }
    )
    
    return jsonify({'message': 'Order status updated successfully'}), 200
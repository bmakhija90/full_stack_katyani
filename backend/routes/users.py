from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from models.user import UserModel
from models.order import OrderModel
from bson import ObjectId


users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    user = UserModel.get_user_profile(request.db, request.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Convert ObjectId to string
    user['_id'] = str(user['_id'])
    
    return jsonify(user), 200

@users_bp.route('/address', methods=['POST'])
@token_required
def add_address():
    data = request.json
    
    required_fields = ['street', 'city', 'county', 'postcode', 'country']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    address = {
        '_id': str(ObjectId()),
        'street': data['street'],
        'city': data['city'],
        'county': data['county'],
        'postcode': data['postcode'],
        'country': data['country'],
        'isDefault': data.get('isDefault', False),
        'phone': data.get('phone', ''),
        'name': data.get('name', '')
    }
    
    UserModel.add_address(request.db, request.user_id, address)
    
    return jsonify({
        'message': 'Address added successfully',
        'address': address
    }), 201
@users_bp.route('/addresses', methods=['GET'])
@token_required
def get_user_addresses():
    """Get all saved addresses for the current user"""
    try:
        # Get user document
        user = request.db.users.find_one(
            {'_id': ObjectId(request.user_id)}
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if addresses field exists and is a list
        addresses = user.get('addresses')
        
        if addresses is None:
            # Addresses field doesn't exist, return empty array
            addresses = []
        elif not isinstance(addresses, list):
            # Addresses exists but is not a list (edge case)
            # Try to convert it if it's a single address object
            if isinstance(addresses, dict):
                addresses = [addresses]
            else:
                addresses = []
        
        # Ensure each address has an _id field
        for address in addresses:
            if '_id' not in address:
                address['_id'] = str(ObjectId())
        
        return jsonify({
            'success': True,
            'count': len(addresses),
            'addresses': addresses
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve addresses',
            'details': str(e)
        }), 500

@users_bp.route('/orders', methods=['GET'])
@token_required
def get_user_orders():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    
    orders = OrderModel.get_user_orders(request.db, request.user_id, page, limit)
    return jsonify(orders), 200

@users_bp.route('/address/<address_id>', methods=['DELETE'])
@token_required
def delete_address(address_id):
    """Delete a specific address from user's saved addresses"""
    try:
        # Validate address_id
        if not address_id or address_id.strip() == '':
            return jsonify({'error': 'Address ID is required'}), 400
        
        # Delete the address from user's addresses array
        result = request.db.users.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$pull': {'addresses': {'_id': address_id}}}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Address deleted successfully'
            }), 200
        elif result.matched_count > 0:
            # User exists but address not found
            return jsonify({
                'success': False,
                'error': 'Address not found'
            }), 404
        else:
            # User not found
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to delete address',
            'details': str(e)
        }), 500

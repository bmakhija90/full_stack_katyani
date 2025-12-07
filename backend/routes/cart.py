from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from datetime import datetime
from bson import ObjectId

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/cart', methods=['GET'])
@token_required
def get_cart():
    user = request.db.users.find_one(
        {'_id': ObjectId(request.user_id)},
        {'cart': 1}
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    cart_items = user.get('cart', [])
    
    # Get product details for cart items
    for item in cart_items:
        product = request.db.products.find_one(
            {'_id': ObjectId(item['productId'])},
            {'name': 1, 'price': 1, 'images': 1, 'availability': 1}
        )
        if product:
            item['product'] = {
                'name': product['name'],
                'price': product['price'],
                'image': product['images'][0] if product.get('images') else None
            }
    
    return jsonify(cart_items), 200

@cart_bp.route('/cart', methods=['POST'])
@token_required
def update_cart():
    data = request.json
    
    if 'productId' not in data or 'quantity' not in data:
        return jsonify({'error': 'productId and quantity are required'}), 400
    
    product = request.db.products.find_one({'_id': ObjectId(data['productId'])})
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    user = request.db.users.find_one({'_id': ObjectId(request.user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    cart = user.get('cart', [])
    
    # Check if product already in cart
    found = False
    for item in cart:
        if item['productId'] == data['productId']:
            item['quantity'] = int(data['quantity'])
            found = True
            break
    
    if not found:
        cart.append({
            'productId': data['productId'],
            'quantity': int(data['quantity']),
            'addedAt': datetime.utcnow()
        })
    
    # Update cart
    request.db.users.update_one(
        {'_id': ObjectId(request.user_id)},
        {
            '$set': {
                'cart': cart,
                'updatedAt': datetime.utcnow()
            }
        }
    )
    
    return jsonify({
        'message': 'Cart updated successfully',
        'cart': cart
    }), 200

@cart_bp.route('/cart/<product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(product_id):
    request.db.users.update_one(
        {'_id': ObjectId(request.user_id)},
        {
            '$pull': {'cart': {'productId': product_id}},
            '$set': {'updatedAt': datetime.utcnow()}
        }
    )
    
    return jsonify({'message': 'Item removed from cart'}), 200
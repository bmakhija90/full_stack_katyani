from flask import Blueprint, request, jsonify
from models.user import UserModel
from utils.validators import validate_email, validate_password
from utils.helpers import hash_password, verify_password, generate_token
from config import Config
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Validate input
    if not all(k in data for k in ('email', 'password', 'firstName', 'lastName')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    if not validate_password(data['password']):
        return jsonify({'error': 'Password must be at least 8 characters with uppercase, lowercase and number'}), 400
    
    # Check if user exists
    existing_user = UserModel.find_by_email(request.db, data['email'])
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    # Create user
    user_data = {
        'email': data['email'],
        'password': hash_password(data['password']),
        'firstName': data['firstName'],
        'lastName': data['lastName'],
        'phone': data.get('phone', '')
    }
    
    user_id = UserModel.create_user(request.db, user_data)
    
    # Generate token
    token = generate_token(user_id)
    
    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'userId': user_id
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = UserModel.find_by_email(request.db, data['email'])
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not verify_password(data['password'], user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(str(user['_id']), user.get('isAdmin', False))
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'userId': str(user['_id']),
        'isAdmin': user.get('isAdmin', False)
    }), 200
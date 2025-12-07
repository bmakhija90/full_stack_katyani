from flask import request, jsonify
import jwt
from datetime import datetime
import os

def token_required(f):
    def decorator(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production'), algorithms=['HS256'])
            request.user_id = payload['user_id']
            request.is_admin = payload.get('is_admin', False)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    decorator.__name__ = f.__name__
    return decorator

def admin_required(f):
    def decorator(*args, **kwargs):
        if not hasattr(request, 'is_admin') or not request.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    
    decorator.__name__ = f.__name__
    return decorator
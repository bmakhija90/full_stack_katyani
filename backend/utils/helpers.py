import bcrypt
import jwt
from datetime import datetime, timedelta
from config import Config
import base64
from bson import ObjectId

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, is_admin=False):
    payload = {
        'user_id': user_id,
        'is_admin': is_admin,
        'exp': datetime.utcnow() + Config.JWT_ACCESS_TOKEN_EXPIRES
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def encode_image_to_base64(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

def object_id_to_string(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
            elif isinstance(value, dict):
                object_id_to_string(value)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, ObjectId):
                        value[i] = str(item)
                    elif isinstance(item, dict):
                        object_id_to_string(item)
    return obj
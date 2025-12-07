import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/ecommerce')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'ecommerce')
    
    # JWT Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Stripe Configuration
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', 'sk_test_51SH4moKyEKE8oRbhTtQxeybfVcwnrnoyiyaCW3kCiLdcJ6y1zyCZTALBeM76Fq8nFvpDlmWObNyA0h6w5UguTsBe00fzdspfwd')
    STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', 'pk_test_51SH4moKyEKE8oRbhlrBqYYSlsiMOjRmpAeGGA9wYjDQdpk6tM3H8xws0GvjFpHgGbiFqBYcJmMqDg9BTKFTZweOg00fS4HPrwN')
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    UPLOAD_FOLDER = 'uploads'
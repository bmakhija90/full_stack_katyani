from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from config import Config
import logging
from datetime import datetime

# Import blueprints
from routes.auth import auth_bp
from routes.products import products_bp
from routes.users import users_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.admin import admin_bp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)  # React app default port

# MongoDB connection
client = MongoClient(Config.MONGO_URI)
db = client[Config.DATABASE_NAME]

# Middleware to attach database to request
@app.before_request
def before_request():
    request.db = db
    logger.info(f"{datetime.utcnow()} - {request.method} {request.path}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api/user')
app.register_blueprint(cart_bp, url_prefix='/api')
app.register_blueprint(orders_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if client.server_info() else 'disconnected'
    }), 200

if __name__ == '__main__':
    # Create indexes for better performance
    db.users.create_index([('email', 1)], unique=True)
    db.products.create_index([('category', 1)])
    db.products.create_index([('name', 'text'), ('description', 'text')])
    db.orders.create_index([('userId', 1), ('createdAt', -1)])
    db.orders.create_index([('createdAt', -1)])
    
    print("Starting Flask server...")
    print(f"Database: {Config.DATABASE_NAME}")
    print(f"CORS enabled for: http://localhost:3000")
    
    app.run(debug=True, host='0.0.0.0', port=6000)
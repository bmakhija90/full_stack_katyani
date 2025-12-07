import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

def validate_product_data(data):
    required_fields = ['name', 'price', 'category']
    for field in required_fields:
        if field not in data:
            return False, f'Missing required field: {field}'
    
    try:
        float(data['price'])
    except ValueError:
        return False, 'Price must be a valid number'
    
    return True, 'Valid'

def validate_order_data(data):
    required_fields = ['userId', 'items', 'totalAmount', 'shippingAddress']
    for field in required_fields:
        if field not in data:
            return False, f'Missing required field: {field}'
    
    if not isinstance(data['items'], list) or len(data['items']) == 0:
        return False, 'Items must be a non-empty list'
    
    return True, 'Valid'
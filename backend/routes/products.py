from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required, admin_required
from models.product import ProductModel
from models.category import CategoryModel
from utils.validators import validate_product_data
from utils.helpers import encode_image_to_base64, object_id_to_string
import base64

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    result = ProductModel.get_all_products(request.db, category, page, limit)
    return jsonify(result), 200

@products_bp.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = ProductModel.get_product_by_id(request.db, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify(product), 200

@products_bp.route('/products', methods=['POST'])
@token_required
@admin_required
def create_product():
    try:
        data = request.form
        
        # Validate product data
        is_valid, message = validate_product_data(data)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Handle images
        images = []
        if 'images' in request.files:
            image_files = request.files.getlist('images')
            for image_file in image_files:
                if image_file.filename:
                    encoded_image = encode_image_to_base64(image_file)
                    images.append({
                        'data': encoded_image,
                        'contentType': image_file.content_type,
                        'filename': image_file.filename
                    })
        
        # Parse sizes if provided
        sizes = []
        if 'sizes' in data:
            try:
                sizes = data['sizes'].split(',') if isinstance(data['sizes'], str) else data['sizes']
            except:
                sizes = []
        
        product_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'price': float(data['price']),
            'category': data['category'],
            'sizes': sizes,
            'availability': data.get('availability', 'true').lower() == 'true',
            'stock': int(data.get('stock', 0))
        }
        
        product_id = ProductModel.create_product(request.db, product_data, images)
        
        return jsonify({
            'message': 'Product created successfully',
            'productId': product_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/products/<product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(product_id):
    try:
        # First, get the existing product
        existing_product = ProductModel.get_product_by_id(request.db, product_id)
        if not existing_product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Initialize update_data with existing images by default
        update_data = {}
        
        # Check if request contains files (multipart/form-data for images)
        if request.content_type and 'multipart/form-data' in request.content_type:
            print("Processing multipart/form-data update")
            data = request.form
            
            # Handle new image uploads if provided
            new_images = []
            if 'images' in request.files:
                image_files = request.files.getlist('images')
                print(f"Found {len(image_files)} image files")
                for image_file in image_files:
                    if image_file.filename:
                        encoded_image = encode_image_to_base64(image_file)
                        new_images.append({
                            'data': encoded_image,
                            'contentType': image_file.content_type,
                            'filename': image_file.filename
                        })
            
            # Parse sizes if provided
            sizes = []
            if 'sizes' in data:
                try:
                    sizes = data['sizes'].split(',') if isinstance(data['sizes'], str) else data['sizes']
                except:
                    sizes = []
            
            # Prepare update data
            if 'name' in data:
                update_data['name'] = data['name']
            if 'description' in data:
                update_data['description'] = data.get('description', '')
            if 'price' in data:
                update_data['price'] = float(data['price'])
            if 'category' in data:
                update_data['category'] = data['category']
            if sizes:
                update_data['sizes'] = sizes
            if 'availability' in data:
                update_data['availability'] = data.get('availability', 'true').lower() == 'true'
            if 'stock' in data:
                update_data['stock'] = int(data.get('stock', 0))
            
            # Handle images - ALWAYS preserve existing images unless explicitly replacing
            if new_images:
                print(f"Adding {len(new_images)} new images")
                # Check if we should replace all images or append
                replace_images = data.get('replace_images', 'false').lower() == 'true'
                
                if replace_images:
                    update_data['images'] = new_images
                else:
                    # Append new images to existing ones
                    update_data['images'] = existing_product.get('images', []) + new_images
            else:
                # No new images, preserve existing ones
                update_data['images'] = existing_product.get('images', [])
                print("Preserving existing images")
            
        else:
            # Regular JSON update - NO IMAGES, just text data
            print("Processing JSON update")
            data = request.json
            update_data = data
            
            # For JSON updates, preserve existing images if not provided
            if 'images' not in data:
                update_data['images'] = existing_product.get('images', [])
                print("Preserving existing images in JSON update")
        
        # Update the product
        updated_product = ProductModel.update_product(request.db, product_id, update_data)
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': updated_product
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in update_product: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = CategoryModel.get_all_categories(request.db)
    return jsonify(categories), 200

@products_bp.route('/categories', methods=['POST'])
@token_required
@admin_required
def create_category():
    data = request.json
    
    if 'name' not in data or 'slug' not in data:
        return jsonify({'error': 'Name and slug are required'}), 400
    
    category_id = CategoryModel.create_category(request.db, data)
    
    return jsonify({
        'message': 'Category created successfully',
        'categoryId': category_id
    }), 201

@products_bp.route('/categories/<category_id>', methods=['PUT'])
@token_required
@admin_required
def update_category(category_id):
    data = request.json
    updated_category = CategoryModel.update_category(request.db, category_id, data)
    
    if not updated_category:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify({
        'message': 'Category updated successfully',
        'category': updated_category
    }), 200
from datetime import datetime
from bson import ObjectId
import base64

class ProductModel:
    @staticmethod
    def create_product(db, product_data, images=None):
        products = db.products
        product = {
            'name': product_data['name'],
            'description': product_data.get('description', ''),
            'price': float(product_data['price']),
            'category': product_data['category'],
            'images': images or [],  # Store base64 encoded images
            'sizes': product_data.get('sizes', []),
            'availability': product_data.get('availability', True),
            'stock': int(product_data.get('stock', 0)),
            'tags': product_data.get('tags', []),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        result = products.insert_one(product)
        return str(result.inserted_id)

    @staticmethod
    def get_all_products(db, category=None, page=1, limit=20):
        products = db.products
        query = {}
        if category:
            query['category'] = category
        
        skip = (page - 1) * limit
        total = products.count_documents(query)
        
        items = list(products.find(query).skip(skip).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for item in items:
            item['_id'] = str(item['_id'])
        
        return {
            'products': items,
            'total': total,
            'page': page,
            'limit': limit,
            'totalPages': (total + limit - 1) // limit
        }

    @staticmethod
    def get_product_by_id(db, product_id):
        product = db.products.find_one({'_id': ObjectId(product_id)})
        if product:
            product['_id'] = str(product['_id'])
        return product

    @staticmethod
    def update_product(db, product_id, update_data):
        db.products.update_one(
            {'_id': ObjectId(product_id)},
            {
                '$set': {**update_data, 'updatedAt': datetime.utcnow()}
            }
        )
        return ProductModel.get_product_by_id(db, product_id)
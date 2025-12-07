from datetime import datetime
from bson import ObjectId

class CategoryModel:
    @staticmethod
    def create_category(db, category_data):
        categories = db.categories
        category = {
            'name': category_data['name'],
            'description': category_data.get('description', ''),
            'slug': category_data['slug'],
            'image': category_data.get('image', ''),
            'isActive': category_data.get('isActive', True),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        result = categories.insert_one(category)
        return str(result.inserted_id)

    @staticmethod
    def get_all_categories(db):
        categories = list(db.categories.find({'isActive': True}))
        for cat in categories:
            cat['_id'] = str(cat['_id'])
        return categories

    @staticmethod
    def update_category(db, category_id, update_data):
        db.categories.update_one(
            {'_id': ObjectId(category_id)},
            {
                '$set': {**update_data, 'updatedAt': datetime.utcnow()}
            }
        )
        return CategoryModel.get_category_by_id(db, category_id)

    @staticmethod
    def get_category_by_id(db, category_id):
        category = db.categories.find_one({'_id': ObjectId(category_id)})
        if category:
            category['_id'] = str(category['_id'])
        return category
from datetime import datetime
from bson import ObjectId

class UserModel:
    @staticmethod
    def create_user(db, user_data):
        users = db.users
        user = {
            'email': user_data['email'],
            'password': user_data['password'],  # Already hashed
            'firstName': user_data.get('firstName', ''),
            'lastName': user_data.get('lastName', ''),
            'phone': user_data.get('phone', ''),
            'addresses': [],
            'cart': [],
            'wishlist': [],
            'isAdmin': False,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        result = users.insert_one(user)
        return str(result.inserted_id)

    @staticmethod
    def find_by_email(db, email):
        return db.users.find_one({'email': email})

    @staticmethod
    def find_by_id(db, user_id):
        return db.users.find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def add_address(db, user_id, address):
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$push': {'addresses': address},
                '$set': {'updatedAt': datetime.utcnow()}
            }
        )

    @staticmethod
    def get_user_profile(db, user_id):
        user = db.users.find_one(
            {'_id': ObjectId(user_id)},
            {'password': 0}  # Exclude password
        )
        return user
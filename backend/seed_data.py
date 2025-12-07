import os
import sys
from pymongo import MongoClient
from datetime import datetime, timedelta
import bcrypt
import random
import json
from bson import ObjectId
import base64

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database configuration
MONGO_URI = "mongodb://localhost:27017/ecommerce"
DATABASE_NAME = "ecommerce"

def hash_password(password):
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_base64_image():
    """Create a simple base64 encoded image (1x1 pixel transparent PNG)"""
    # A minimal 1x1 transparent PNG in base64
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

class DatabaseSeeder:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[DATABASE_NAME]
        print(f"Connected to database: {DATABASE_NAME}")
        
    def clear_database(self):
        """Clear all collections (optional)"""
        print("Clearing existing data...")
        collections = ['users', 'products', 'categories', 'orders']
        for collection in collections:
            self.db[collection].delete_many({})
            print(f"  Cleared {collection}")
        print("Database cleared!\n")
    
    def seed_users(self):
        """Seed users into the database"""
        print("Seeding users...")
        
        users = [
            {
                "email": "admin@example.com",
                "password": hash_password("Admin123"),
                "firstName": "Admin",
                "lastName": "User",
                "phone": "+1234567890",
                "addresses": [
                    {
                        "_id": str(ObjectId()),
                        "street": "123 Admin Street",
                        "city": "Admin City",
                        "state": "CA",
                        "zipCode": "94105",
                        "country": "USA",
                        "isDefault": True,
                        "phone": "+1234567890",
                        "name": "Admin User"
                    }
                ],
                "cart": [],
                "wishlist": [],
                "isAdmin": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "email": "john.doe@example.com",
                "password": hash_password("Test1234"),
                "firstName": "John",
                "lastName": "Doe",
                "phone": "+1234567891",
                "addresses": [
                    {
                        "_id": str(ObjectId()),
                        "street": "456 Main Street",
                        "city": "New York",
                        "state": "NY",
                        "zipCode": "10001",
                        "country": "USA",
                        "isDefault": True,
                        "phone": "+1234567891",
                        "name": "John Doe"
                    },
                    {
                        "_id": str(ObjectId()),
                        "street": "789 Broadway",
                        "city": "Brooklyn",
                        "state": "NY",
                        "zipCode": "11201",
                        "country": "USA",
                        "isDefault": False,
                        "phone": "+1234567891",
                        "name": "John Doe"
                    }
                ],
                "cart": [],
                "wishlist": [],
                "isAdmin": False,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "email": "jane.smith@example.com",
                "password": hash_password("Test1234"),
                "firstName": "Jane",
                "lastName": "Smith",
                "phone": "+1234567892",
                "addresses": [
                    {
                        "_id": str(ObjectId()),
                        "street": "321 Oak Avenue",
                        "city": "Los Angeles",
                        "state": "CA",
                        "zipCode": "90001",
                        "country": "USA",
                        "isDefault": True,
                        "phone": "+1234567892",
                        "name": "Jane Smith"
                    }
                ],
                "cart": [],
                "wishlist": [],
                "isAdmin": False,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        
        for user in users:
            # Check if user already exists
            existing_user = self.db.users.find_one({"email": user["email"]})
            if not existing_user:
                result = self.db.users.insert_one(user)
                print(f"  Created user: {user['email']} (ID: {result.inserted_id})")
            else:
                print(f"  User already exists: {user['email']}")
        
        print(f"Total users seeded: {self.db.users.count_documents({})}\n")
        return users
    
    def seed_categories(self):
        """Seed categories into the database"""
        print("Seeding categories...")
        
        categories = [
            {
                "name": "Electronics",
                "description": "Latest gadgets and electronic devices",
                "slug": "electronics",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Clothing",
                "description": "Fashionable clothing for everyone",
                "slug": "clothing",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Home & Kitchen",
                "description": "Home essentials and kitchen appliances",
                "slug": "home-kitchen",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Books",
                "description": "Books from all genres",
                "slug": "books",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Sports & Outdoors",
                "description": "Sports equipment and outdoor gear",
                "slug": "sports-outdoors",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Beauty & Personal Care",
                "description": "Beauty products and personal care items",
                "slug": "beauty-personal-care",
                "image": create_base64_image(),
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        
        for category in categories:
            # Check if category already exists
            existing_category = self.db.categories.find_one({"slug": category["slug"]})
            if not existing_category:
                result = self.db.categories.insert_one(category)
                print(f"  Created category: {category['name']} (Slug: {category['slug']})")
            else:
                print(f"  Category already exists: {category['name']}")
        
        print(f"Total categories seeded: {self.db.categories.count_documents({})}\n")
        return categories
    
    def seed_products(self):
        """Seed products into the database"""
        print("Seeding products...")
        
        # Get categories for product assignment
        categories = list(self.db.categories.find())
        if not categories:
            print("  No categories found. Please seed categories first.")
            return []
        
        # Sample images (base64 encoded 1x1 pixel PNG)
        sample_images = [
            {
                "data": create_base64_image(),
                "contentType": "image/png",
                "filename": "product1.png"
            },
            {
                "data": create_base64_image(),
                "contentType": "image/png",
                "filename": "product2.png"
            }
        ]
        
        products = [
            {
                "name": "Smartphone X",
                "description": "Latest smartphone with advanced camera and long battery life",
                "price": 699.99,
                "category": "electronics",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 50,
                "tags": ["smartphone", "mobile", "android", "5g"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Laptop Pro",
                "description": "High-performance laptop for professionals and gamers",
                "price": 1299.99,
                "category": "electronics",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 25,
                "tags": ["laptop", "computer", "gaming", "work"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Wireless Headphones",
                "description": "Noise-cancelling wireless headphones with premium sound",
                "price": 199.99,
                "category": "electronics",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 100,
                "tags": ["headphones", "audio", "wireless", "music"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Cotton T-Shirt",
                "description": "100% cotton t-shirt, comfortable and durable",
                "price": 19.99,
                "category": "clothing",
                "images": sample_images,
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "availability": True,
                "stock": 200,
                "tags": ["clothing", "t-shirt", "casual", "cotton"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Denim Jeans",
                "description": "Classic blue denim jeans, perfect for casual wear",
                "price": 49.99,
                "category": "clothing",
                "images": sample_images,
                "sizes": ["30x32", "32x32", "34x32", "36x32"],
                "availability": True,
                "stock": 150,
                "tags": ["clothing", "jeans", "denim", "casual"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Coffee Maker",
                "description": "Programmable coffee maker with thermal carafe",
                "price": 89.99,
                "category": "home-kitchen",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 75,
                "tags": ["kitchen", "appliance", "coffee", "home"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Cookbook: Healthy Recipes",
                "description": "Collection of healthy and delicious recipes",
                "price": 24.99,
                "category": "books",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 300,
                "tags": ["book", "cooking", "recipes", "health"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Yoga Mat",
                "description": "Non-slip yoga mat with carrying strap",
                "price": 29.99,
                "category": "sports-outdoors",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 120,
                "tags": ["sports", "yoga", "fitness", "exercise"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "name": "Face Cream",
                "description": "Moisturizing face cream with SPF 30 protection",
                "price": 34.99,
                "category": "beauty-personal-care",
                "images": sample_images,
                "sizes": [],
                "availability": True,
                "stock": 250,
                "tags": ["beauty", "skincare", "moisturizer", "spf"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        
        inserted_products = []
        for product in products:
            # Check if product already exists
            existing_product = self.db.products.find_one({"name": product["name"]})
            if not existing_product:
                result = self.db.products.insert_one(product)
                product["_id"] = str(result.inserted_id)
                inserted_products.append(product)
                print(f"  Created product: {product['name']} (${product['price']})")
            else:
                print(f"  Product already exists: {product['name']}")
        
        print(f"Total products seeded: {self.db.products.count_documents({})}\n")
        return inserted_products
    
    def seed_orders(self):
        """Seed sample orders into the database"""
        print("Seeding orders...")
        
        # Get users and products
        users = list(self.db.users.find({"isAdmin": False}))  # Get non-admin users
        products = list(self.db.products.find().limit(5))
        
        if not users or not products:
            print("  Need users and products to create orders")
            return []
        
        orders = []
        
        # Create orders for last 30 days
        for i in range(10):
            user = random.choice(users)
            order_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
            
            # Create order items
            num_items = random.randint(1, 3)
            order_items = []
            total_amount = 0
            
            for _ in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                price = product["price"]
                subtotal = price * quantity
                total_amount += subtotal
                
                order_items.append({
                    "productId": str(product["_id"]),
                    "name": product["name"],
                    "price": price,
                    "quantity": quantity,
                    "subtotal": subtotal
                })
            
            # Get user's default address
            default_address = next((addr for addr in user.get("addresses", []) if addr.get("isDefault", False)), None)
            if not default_address and user.get("addresses"):
                default_address = user["addresses"][0]
            
            shipping_address = default_address if default_address else {
                "street": "123 Unknown Street",
                "city": "Unknown",
                "state": "CA",
                "zipCode": "00000",
                "country": "USA",
                "name": f"{user['firstName']} {user['lastName']}"
            }
            
            # Order status progression
            statuses = ["processing", "shipped", "delivered", "cancelled"]
            # Older orders more likely to be delivered/cancelled
            if order_date < datetime.utcnow() - timedelta(days=7):
                status = random.choices(statuses, weights=[0.1, 0.2, 0.6, 0.1])[0]
            else:
                status = random.choices(statuses, weights=[0.4, 0.4, 0.1, 0.1])[0]
            
            payment_status = "completed" if status != "cancelled" else "refunded"
            
            order = {
                "userId": str(user["_id"]),
                "items": order_items,
                "totalAmount": round(total_amount, 2),
                "shippingAddress": shipping_address,
                "paymentMethod": random.choice(["stripe", "paypal", "cod"]),
                "paymentStatus": payment_status,
                "orderStatus": status,
                "stripePaymentId": f"pi_{random.randint(1000000000, 9999999999)}" if payment_status == "completed" else "",
                "createdAt": order_date,
                "updatedAt": order_date + timedelta(hours=random.randint(1, 72))
            }
            
            result = self.db.orders.insert_one(order)
            order["_id"] = str(result.inserted_id)
            orders.append(order)
            print(f"  Created order #{i+1}: ${order['totalAmount']} - Status: {order['orderStatus']}")
        
        print(f"Total orders seeded: {self.db.orders.count_documents({})}\n")
        return orders
    
    def seed_cart_items(self):
        """Add items to user carts"""
        print("Seeding cart items...")
        
        # Get non-admin users
        users = list(self.db.users.find({"isAdmin": False}))
        products = list(self.db.products.find())
        
        if not users or not products:
            print("  Need users and products to add to cart")
            return
        
        for user in users:
            # Add 1-3 random products to cart
            num_items = random.randint(0, 3)  # 0-3 items per user
            cart_items = []
            
            for _ in range(num_items):
                product = random.choice(products)
                cart_items.append({
                    "productId": str(product["_id"]),
                    "quantity": random.randint(1, 3),
                    "addedAt": datetime.utcnow()
                })
            
            if cart_items:
                self.db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"cart": cart_items}}
                )
                print(f"  Added {len(cart_items)} items to {user['email']}'s cart")
        
        print("Cart items seeded!\n")
    
    def create_sample_admin_product(self):
        """Create a sample product specifically for admin testing"""
        print("Creating sample admin product...")
        
        product_data = {
            "name": "Premium Wireless Earbuds",
            "description": "High-quality wireless earbuds with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
            "price": 149.99,
            "category": "electronics",
            "images": [{
                "data": create_base64_image(),
                "contentType": "image/png",
                "filename": "earbuds.png"
            }],
            "sizes": [],
            "availability": True,
            "stock": 75,
            "tags": ["earbuds", "wireless", "audio", "noise-cancelling", "premium"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = self.db.products.insert_one(product_data)
        print(f"  Created admin test product: {product_data['name']} (ID: {result.inserted_id})")
        return str(result.inserted_id)
    
    def generate_test_credentials(self):
        """Print test credentials for API testing"""
        print("\n" + "="*50)
        print("TEST CREDENTIALS FOR API TESTING")
        print("="*50)
        
        # Admin user
        admin = self.db.users.find_one({"email": "admin@example.com"})
        if admin:
            print("\n🔧 ADMIN USER (Full Access):")
            print(f"  Email: admin@example.com")
            print(f"  Password: Admin123")
            print(f"  User ID: {admin['_id']}")
        
        # Regular users
        print("\n👤 REGULAR USERS:")
        users = self.db.users.find({"isAdmin": False})
        for user in users:
            print(f"  Email: {user['email']}")
            print(f"  Password: Test1234")
            print(f"  User ID: {user['_id']}")
            print()
        
        # Sample API endpoints
        print("\n🌐 SAMPLE API ENDPOINTS:")
        print("  Health Check: GET http://localhost:5000/api/health")
        print("  Register: POST http://localhost:5000/api/auth/register")
        print("  Login: POST http://localhost:5000/api/auth/login")
        print("  Get Products: GET http://localhost:5000/api/products")
        print("  Get Categories: GET http://localhost:5000/api/categories")
        print("  User Profile: GET http://localhost:5000/api/user/profile (Requires Auth)")
        print("  Add to Cart: POST http://localhost:5000/api/cart (Requires Auth)")
        print("="*50 + "\n")
    
    def verify_seeding(self):
        """Verify that data was seeded correctly"""
        print("\n" + "="*50)
        print("DATABASE VERIFICATION")
        print("="*50)
        
        counts = {
            "users": self.db.users.count_documents({}),
            "products": self.db.products.count_documents({}),
            "categories": self.db.categories.count_documents({}),
            "orders": self.db.orders.count_documents({})
        }
        
        for collection, count in counts.items():
            status = "✅" if count > 0 else "❌"
            print(f"{status} {collection.capitalize()}: {count} documents")
        
        # Check for admin user
        admin = self.db.users.find_one({"isAdmin": True})
        if admin:
            print(f"✅ Admin user found: {admin['email']}")
        else:
            print("❌ No admin user found")
        
        # Check categories have products
        categories = self.db.categories.find()
        for category in categories:
            product_count = self.db.products.count_documents({"category": category["slug"]})
            status = "✅" if product_count > 0 else "⚠️"
            print(f"{status} Category '{category['name']}': {product_count} products")
        
        print("="*50)
        
        if all(count > 0 for count in counts.values()):
            print("\n🎉 Seeding completed successfully!")
            return True
        else:
            print("\n⚠️  Some collections may be empty")
            return False

def main():
    """Main function to run the seeder"""
    print("="*50)
    print("ECOMMERCE DATABASE SEEDER")
    print("="*50)
    
    try:
        # Initialize seeder
        seeder = DatabaseSeeder()
        
        # Ask for confirmation to clear existing data
        clear_data = input("\nDo you want to clear existing data? (y/n): ").lower().strip()
        if clear_data == 'y':
            seeder.clear_database()
        else:
            print("Keeping existing data...\n")
        
        # Seed data
        print("Starting data seeding process...\n")
        
        # Seed in order
        seeder.seed_users()
        seeder.seed_categories()
        seeder.seed_products()
        seeder.seed_orders()
        seeder.seed_cart_items()
        
        # Create a sample product for admin testing
        seeder.create_sample_admin_product()
        
        # Verify seeding
        seeder.verify_seeding()
        
        # Generate test credentials
        seeder.generate_test_credentials()
        
        print("\n✨ Database seeding completed! ✨")
        print("\nNext steps:")
        print("1. Start the Flask server: python app.py")
        print("2. Use the test credentials above to login")
        print("3. Test the API endpoints with Postman or curl")
        print("4. Connect your React frontend to http://localhost:5000")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
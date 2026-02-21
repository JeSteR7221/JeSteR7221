#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class LuminaPOSAPITester:
    def __init__(self, base_url="https://restoran-pos-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.branch_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_api_health(self):
        """Test if API is running"""
        success, response = self.make_request('GET', '')
        self.log_test("API Health Check", success, 
                     f"Status: {response.get('status', 'unknown')}" if success else str(response))
        return success

    def test_init_demo_data(self):
        """Initialize demo data"""
        success, response = self.make_request('POST', 'init-demo-data', expected_status=200)
        if success:
            self.branch_id = response.get('branch_id')
            self.log_test("Demo Data Initialization", True, f"Branch ID: {self.branch_id}")
        else:
            self.log_test("Demo Data Initialization", False, str(response))
        return success

    def test_login_all_roles(self):
        """Test login for all three roles"""
        credentials = [
            {"email": "admin@lumina.com", "password": "admin123", "role": "admin"},
            {"email": "kasiyer@lumina.com", "password": "kasiyer123", "role": "cashier"},
            {"email": "mutfak@lumina.com", "password": "mutfak123", "role": "kitchen"}
        ]
        
        all_success = True
        for cred in credentials:
            success, response = self.make_request('POST', 'auth/login', {
                "email": cred["email"],
                "password": cred["password"]
            })
            
            if success and 'access_token' in response:
                self.tokens[cred["role"]] = response['access_token']
                user_role = response.get('user', {}).get('role', 'unknown')
                self.log_test(f"Login - {cred['role'].title()}", True, f"Role: {user_role}")
            else:
                self.log_test(f"Login - {cred['role'].title()}", False, str(response))
                all_success = False
        
        return all_success

    def test_auth_me(self):
        """Test /auth/me endpoint for all roles"""
        all_success = True
        for role, token in self.tokens.items():
            success, response = self.make_request('GET', 'auth/me', token=token)
            if success:
                user_email = response.get('email', 'unknown')
                self.log_test(f"Auth Me - {role.title()}", True, f"Email: {user_email}")
            else:
                self.log_test(f"Auth Me - {role.title()}", False, str(response))
                all_success = False
        return all_success

    def test_branches_api(self):
        """Test branches API"""
        if not self.tokens.get('admin'):
            self.log_test("Branches API", False, "No admin token available")
            return False

        # Get branches
        success, response = self.make_request('GET', 'branches', token=self.tokens['admin'])
        if success:
            branches_count = len(response) if isinstance(response, list) else 0
            self.log_test("Get Branches", True, f"Found {branches_count} branches")
        else:
            self.log_test("Get Branches", False, str(response))
            return False

        # Get specific branch
        if self.branch_id:
            success, response = self.make_request('GET', f'branches/{self.branch_id}', 
                                                token=self.tokens['admin'])
            if success:
                branch_name = response.get('name', 'unknown')
                self.log_test("Get Branch by ID", True, f"Branch: {branch_name}")
            else:
                self.log_test("Get Branch by ID", False, str(response))
                return False

        return True

    def test_categories_api(self):
        """Test categories API"""
        if not self.tokens.get('admin') or not self.branch_id:
            self.log_test("Categories API", False, "Missing admin token or branch_id")
            return False

        # Get categories
        success, response = self.make_request('GET', f'categories?branch_id={self.branch_id}', 
                                            token=self.tokens['admin'])
        if success:
            categories_count = len(response) if isinstance(response, list) else 0
            self.log_test("Get Categories", True, f"Found {categories_count} categories")
            return categories_count > 0
        else:
            self.log_test("Get Categories", False, str(response))
            return False

    def test_products_api(self):
        """Test products API"""
        if not self.tokens.get('admin') or not self.branch_id:
            self.log_test("Products API", False, "Missing admin token or branch_id")
            return False

        # Get products
        success, response = self.make_request('GET', f'products?branch_id={self.branch_id}', 
                                            token=self.tokens['admin'])
        if success:
            products_count = len(response) if isinstance(response, list) else 0
            self.log_test("Get Products", True, f"Found {products_count} products")
            return products_count > 0
        else:
            self.log_test("Get Products", False, str(response))
            return False

    def test_tables_api(self):
        """Test tables API"""
        if not self.tokens.get('admin') or not self.branch_id:
            self.log_test("Tables API", False, "Missing admin token or branch_id")
            return False

        # Get tables
        success, response = self.make_request('GET', f'tables?branch_id={self.branch_id}', 
                                            token=self.tokens['admin'])
        if success:
            tables_count = len(response) if isinstance(response, list) else 0
            self.log_test("Get Tables", True, f"Found {tables_count} tables")
            return tables_count > 0
        else:
            self.log_test("Get Tables", False, str(response))
            return False

    def test_orders_api(self):
        """Test orders API"""
        if not self.tokens.get('cashier') or not self.branch_id:
            self.log_test("Orders API", False, "Missing cashier token or branch_id")
            return False

        # Get orders
        success, response = self.make_request('GET', f'orders?branch_id={self.branch_id}', 
                                            token=self.tokens['cashier'])
        if success:
            orders_count = len(response) if isinstance(response, list) else 0
            self.log_test("Get Orders", True, f"Found {orders_count} orders")
        else:
            self.log_test("Get Orders", False, str(response))
            return False

        return True

    def test_create_order(self):
        """Test creating an order"""
        if not self.tokens.get('cashier') or not self.branch_id:
            self.log_test("Create Order", False, "Missing cashier token or branch_id")
            return False

        # First get products to create order items
        success, products = self.make_request('GET', f'products?branch_id={self.branch_id}', 
                                            token=self.tokens['cashier'])
        if not success or not products:
            self.log_test("Create Order", False, "No products available")
            return False

        # Get tables
        success, tables = self.make_request('GET', f'tables?branch_id={self.branch_id}', 
                                          token=self.tokens['cashier'])
        if not success or not tables:
            self.log_test("Create Order", False, "No tables available")
            return False

        # Create order with first product and table
        product = products[0]
        table = tables[0]
        
        order_data = {
            "branch_id": self.branch_id,
            "table_id": table["id"],
            "table_number": table["number"],
            "order_type": "dine_in",
            "items": [{
                "product_id": product["id"],
                "product_name": product["name"],
                "quantity": 2,
                "unit_price": product["price"],
                "total_price": product["price"] * 2
            }],
            "subtotal": product["price"] * 2,
            "tax_amount": (product["price"] * 2) * 0.18,
            "total": (product["price"] * 2) * 1.18,
            "notes": "Test order"
        }

        success, response = self.make_request('POST', 'orders', order_data, 
                                            token=self.tokens['cashier'], expected_status=200)
        if success:
            order_id = response.get('id')
            order_number = response.get('order_number')
            self.log_test("Create Order", True, f"Order #{order_number} created with ID: {order_id}")
            return order_id
        else:
            self.log_test("Create Order", False, str(response))
            return None

    def test_settings_api(self):
        """Test settings API"""
        if not self.tokens.get('admin'):
            self.log_test("Settings API", False, "No admin token available")
            return False

        # Get settings
        success, response = self.make_request('GET', 'settings', token=self.tokens['admin'])
        if success:
            business_name = response.get('business_name', 'unknown')
            self.log_test("Get Settings", True, f"Business: {business_name}")
        else:
            self.log_test("Get Settings", False, str(response))
            return False

        return True

    def test_qr_menu_api(self):
        """Test QR menu API (public endpoint)"""
        if not self.branch_id:
            self.log_test("QR Menu API", False, "No branch_id available")
            return False

        success, response = self.make_request('GET', f'qr/menu/{self.branch_id}')
        if success:
            categories_count = len(response.get('categories', []))
            products_count = len(response.get('products', []))
            self.log_test("QR Menu API", True, 
                         f"Categories: {categories_count}, Products: {products_count}")
        else:
            self.log_test("QR Menu API", False, str(response))
            return False

        return True

    def test_reports_api(self):
        """Test reports API"""
        if not self.tokens.get('admin') or not self.branch_id:
            self.log_test("Reports API", False, "Missing admin token or branch_id")
            return False

        # Test daily report
        success, response = self.make_request('GET', f'reports/daily/{self.branch_id}', 
                                            token=self.tokens['admin'])
        if success:
            total_orders = response.get('total_orders', 0)
            total_revenue = response.get('total_revenue', 0)
            self.log_test("Daily Report", True, 
                         f"Orders: {total_orders}, Revenue: {total_revenue}")
        else:
            self.log_test("Daily Report", False, str(response))
            return False

        # Test summary report
        success, response = self.make_request('GET', f'reports/summary/{self.branch_id}', 
                                            token=self.tokens['admin'])
        if success:
            total_orders = response.get('total_orders', 0)
            self.log_test("Summary Report", True, f"Total Orders: {total_orders}")
        else:
            self.log_test("Summary Report", False, str(response))
            return False

        return True

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Lumina POS Backend API Tests")
        print("=" * 50)

        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False

        # Initialize demo data
        self.test_init_demo_data()

        # Authentication tests
        if not self.test_login_all_roles():
            print("❌ Login tests failed. Stopping tests.")
            return False

        self.test_auth_me()

        # Core API tests
        self.test_branches_api()
        self.test_categories_api()
        self.test_products_api()
        self.test_tables_api()
        self.test_orders_api()
        
        # Order creation test
        order_id = self.test_create_order()
        
        # Settings and QR tests
        self.test_settings_api()
        self.test_qr_menu_api()
        self.test_reports_api()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Backend API tests mostly successful!")
        elif success_rate >= 60:
            print("⚠️  Backend API has some issues but core functionality works")
        else:
            print("❌ Backend API has significant issues")

        return success_rate >= 60

def main():
    tester = LuminaPOSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
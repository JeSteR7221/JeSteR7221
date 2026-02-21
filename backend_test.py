import requests
import sys
import json
from datetime import datetime, timedelta

class DentistAPITester:
    def __init__(self, base_url="https://smile-dental-care.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                except:
                    print(f"   Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                self.failed_tests.append({
                    'test': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'endpoint': endpoint,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_create_appointment(self):
        """Test appointment creation"""
        # Get tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        appointment_data = {
            "name": "Test Hasta",
            "phone": "05551234567",
            "email": "test@example.com",
            "date": tomorrow,
            "message": "Test randevu mesajı"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        return success, response.get('id') if success else None

    def test_get_appointments(self):
        """Test getting all appointments"""
        return self.run_test(
            "Get Appointments",
            "GET",
            "appointments",
            200
        )

    def test_create_contact(self):
        """Test contact message creation"""
        contact_data = {
            "name": "Test Müşteri",
            "email": "contact@example.com",
            "message": "Test iletişim mesajı"
        }
        
        success, response = self.run_test(
            "Create Contact",
            "POST",
            "contact",
            200,
            data=contact_data
        )
        
        return success, response.get('id') if success else None

    def test_get_contacts(self):
        """Test getting all contacts"""
        return self.run_test(
            "Get Contacts",
            "GET",
            "contact",
            200
        )

def main():
    print("🚀 Starting Dentist API Tests")
    print("=" * 50)
    
    tester = DentistAPITester()
    
    # Test API connectivity first
    print("\n📡 Testing API Connectivity...")
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ Cannot connect to API. Backend may be down.")
        return 1

    # Test appointment flow
    print("\n📅 Testing Appointment Flow...")
    appointment_success, appointment_id = tester.test_create_appointment()
    tester.test_get_appointments()

    # Test contact flow
    print("\n📝 Testing Contact Flow...")
    contact_success, contact_id = tester.test_create_contact()
    tester.test_get_contacts()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"{test.get('actual')} != {test.get('expected')}")
            print(f"   - {test['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100
    print(f"   Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
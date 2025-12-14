"""
Simple test for partial update - works with port 8001
"""
import requests

BASE_URL = "http://localhost:8001"

print("=" * 60)
print("Testing PUT /api/v1/users/me on port 8001")
print("=" * 60)

# Step 1: Register
print("\n1. Registering new user...")
register_data = {
    "username": "testupdate2",
    "email": "testupdate2@post.bgu.ac.il",
    "password": "password123",
    "full_name": "Test Update User",
    "year_in_degree": 1,
    "department": "Computer Science",
    "department_number": 372
}

register_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=register_data)
print(f"Register status: {register_response.status_code}")

if register_response.status_code == 201:
    print("✅ User registered successfully!")
elif register_response.status_code == 400:
    print("⚠️ User already exists, will try to login...")
else:
    print(f"❌ Registration failed: {register_response.text}")
    exit(1)

# Step 2: Verify email manually via database
print("\n2. Verifying email...")
print("⚠️ You need to verify the email manually in the database")
print("   Run this SQL query:")
print(f"   UPDATE users SET is_email_verified = true, is_active = true WHERE username = 'testupdate2';")
input("\nPress Enter after you verified the email in the database...")

# Step 3: Login
print("\n3. Logging in...")
login_data = {
    "username": "testupdate2",
    "password": "password123"
}

login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")
    exit(1)

token_data = login_response.json()
access_token = token_data["access_token"]
print(f"✅ Login successful!")
print(f"Access Token: {access_token[:50]}...")

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Step 4: Get current profile
print("\n4. Getting current profile...")
profile_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)

if profile_response.status_code != 200:
    print(f"❌ Failed to get profile: {profile_response.status_code}")
    print(f"Response: {profile_response.text}")
    exit(1)

current_profile = profile_response.json()
print(f"✅ Current profile:")
print(f"   Username: {current_profile.get('username')}")
print(f"   Full Name: {current_profile.get('full_name')}")
print(f"   Year in Degree: {current_profile.get('year_in_degree')}")
print(f"   Department: {current_profile.get('department')}")
print(f"   Department Number: {current_profile.get('department_number')}")

# Step 5: Partial update - ONLY year_in_degree
print("\n5. Updating ONLY year_in_degree to 3...")
update_data = {
    "year_in_degree": 3
}

update_response = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json=update_data
)

if update_response.status_code != 200:
    print(f"❌ Update failed: {update_response.status_code}")
    print(f"Response: {update_response.text}")
    exit(1)

updated_profile = update_response.json()
print(f"✅ Update successful!")
print(f"\nUpdated profile:")
print(f"   Full Name: {updated_profile.get('full_name')} (should be UNCHANGED)")
print(f"   Year in Degree: {updated_profile.get('year_in_degree')} (should be 3)")
print(f"   Department: {updated_profile.get('department')} (should be UNCHANGED)")
print(f"   Department Number: {updated_profile.get('department_number')} (should be UNCHANGED)")

# Verify
if (updated_profile.get('year_in_degree') == 3 and
    updated_profile.get('full_name') == current_profile.get('full_name') and
    updated_profile.get('department') == current_profile.get('department')):
    print("\n✅✅✅ SUCCESS! Partial update works correctly!")
    print("Only year_in_degree was changed, all other fields remained the same.")
else:
    print("\n❌ FAILED! Other fields were changed unexpectedly.")

print("\n" + "=" * 60)
print("Test completed!")
print("=" * 60)
print("\nFor Postman:")
print(f"1. Login at: POST {BASE_URL}/api/v1/auth/login")
print(f"   Body: {login_data}")
print(f"2. Copy the access_token from response")
print(f"3. PUT {BASE_URL}/api/v1/users/me")
print(f"   Authorization: Bearer <access_token>")
print(f"   Body: {{\"year_in_degree\": 4}}")

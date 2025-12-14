"""
Complete test: Register user, verify email, test partial update.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("Complete Partial Update Test")
print("=" * 60)

# Step 1: Register new user
print("\n1. Registering new user...")
register_response = requests.post(
    f"{BASE_URL}/api/v1/auth/register",
    json={
        "username": "partialtest",
        "email": "partialtest@post.bgu.ac.il",
        "password": "password123",
        "full_name": "Partial Test User",
        "year_in_degree": 1,
        "department": "Computer Science",
        "department_number": 372
    }
)

if register_response.status_code == 201:
    user_data = register_response.json()
    user_id = user_data["id"]
    print(f"✅ User registered! ID: {user_id}")
else:
    print(f"⚠️ Registration response: {register_response.status_code}")
    if register_response.status_code == 400:
        print("   User might already exist, continuing with existing user...")
    else:
        print(register_response.text)

# Step 2: Manually verify email in database
print("\n2. Manually verifying email in database...")
import sys
sys.path.insert(0, "c:\\Users\\yuval\\Desktop\\studies\\forth year\\final project\\StudyHub\\backend")

from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.username == "partialtest").first()
if user:
    user.is_email_verified = True
    user.is_active = True
    db.commit()
    print(f"✅ Email verified for user: {user.username}")
else:
    print("❌ User not found in database")
    exit(1)
db.close()

# Step 3: Login
print("\n3. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/api/v1/auth/login",
    json={
        "username": "partialtest",
        "password": "password123"
    }
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Login successful!")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 4: Get current profile
print("\n4. Getting current profile...")
profile_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
current_profile = profile_response.json()
print(f"✅ Current profile:")
print(f"   Full Name: {current_profile.get('full_name')}")
print(f"   Year in Degree: {current_profile.get('year_in_degree')}")
print(f"   Department: {current_profile.get('department')}")
print(f"   Department Number: {current_profile.get('department_number')}")
print(f"   Bio: {current_profile.get('bio')}")

# TEST 1: Update ONLY year_in_degree
print("\n" + "=" * 60)
print("TEST 1: Update ONLY year_in_degree")
print("=" * 60)
update_response = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={"year_in_degree": 3}
)

updated_profile = update_response.json()
print(f"\nAfter update:")
print(f"   Full Name: {updated_profile.get('full_name')}")
print(f"   Year in Degree: {updated_profile.get('year_in_degree')}")
print(f"   Department: {updated_profile.get('department')}")
print(f"   Department Number: {updated_profile.get('department_number')}")

if (updated_profile.get('year_in_degree') == 3 and
    updated_profile.get('full_name') == current_profile.get('full_name') and
    updated_profile.get('department') == current_profile.get('department') and
    updated_profile.get('department_number') == current_profile.get('department_number')):
    print("\n✅ PASS: Only year_in_degree changed!")
else:
    print("\n❌ FAIL: Unexpected changes!")

# TEST 2: Update ONLY bio
print("\n" + "=" * 60)
print("TEST 2: Update ONLY bio")
print("=" * 60)
update_response2 = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={"bio": "I love coding!"}
)

updated_profile2 = update_response2.json()
print(f"\nAfter update:")
print(f"   Bio: {updated_profile2.get('bio')}")
print(f"   Year in Degree: {updated_profile2.get('year_in_degree')}")
print(f"   Full Name: {updated_profile2.get('full_name')}")

if (updated_profile2.get('bio') == "I love coding!" and
    updated_profile2.get('year_in_degree') == 3 and
    updated_profile2.get('full_name') == current_profile.get('full_name')):
    print("\n✅ PASS: Only bio changed!")
else:
    print("\n❌ FAIL: Unexpected changes!")

# TEST 3: Update multiple fields
print("\n" + "=" * 60)
print("TEST 3: Update MULTIPLE fields (full_name + department_number)")
print("=" * 60)
update_response3 = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={
        "full_name": "Updated Name",
        "department_number": 500
    }
)

updated_profile3 = update_response3.json()
print(f"\nAfter update:")
print(f"   Full Name: {updated_profile3.get('full_name')}")
print(f"   Department Number: {updated_profile3.get('department_number')}")
print(f"   Year in Degree: {updated_profile3.get('year_in_degree')}")
print(f"   Bio: {updated_profile3.get('bio')}")
print(f"   Department: {updated_profile3.get('department')}")

if (updated_profile3.get('full_name') == "Updated Name" and
    updated_profile3.get('department_number') == 500 and
    updated_profile3.get('year_in_degree') == 3 and
    updated_profile3.get('bio') == "I love coding!" and
    updated_profile3.get('department') == current_profile.get('department')):
    print("\n✅ PASS: Multiple fields updated, others unchanged!")
else:
    print("\n❌ FAIL: Unexpected changes!")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETE!")
print("=" * 60)

"""
Test script to verify partial update functionality.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Test partial update
print("=" * 60)
print("Testing Partial Update for PUT /api/v1/users/me")
print("=" * 60)

# First, login to get a token
print("\n1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/api/v1/auth/login",
    json={
        "username": "updatetest",
        "password": "password123"
    }
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Login successful! Token: {token[:20]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get current profile
print("\n2. Getting current profile...")
profile_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
if profile_response.status_code == 200:
    current_profile = profile_response.json()
    print(f"✅ Current profile:")
    print(f"   Full Name: {current_profile.get('full_name')}")
    print(f"   Year in Degree: {current_profile.get('year_in_degree')}")
    print(f"   Department: {current_profile.get('department')}")
    print(f"   Department Number: {current_profile.get('department_number')}")
    print(f"   Bio: {current_profile.get('bio')}")
else:
    print(f"❌ Failed to get profile: {profile_response.status_code}")

# Test 1: Update ONLY year_in_degree
print("\n3. Test 1: Updating ONLY year_in_degree to 2...")
update_response = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={"year_in_degree": 2}
)

if update_response.status_code == 200:
    updated_profile = update_response.json()
    print(f"✅ Update successful!")
    print(f"   Full Name: {updated_profile.get('full_name')} (should be UNCHANGED)")
    print(f"   Year in Degree: {updated_profile.get('year_in_degree')} (should be 2)")
    print(f"   Department: {updated_profile.get('department')} (should be UNCHANGED)")
    print(f"   Department Number: {updated_profile.get('department_number')} (should be UNCHANGED)")

    # Verify only year_in_degree changed
    if (updated_profile.get('year_in_degree') == 2 and
        updated_profile.get('full_name') == current_profile.get('full_name') and
        updated_profile.get('department') == current_profile.get('department') and
        updated_profile.get('department_number') == current_profile.get('department_number')):
        print("\n✅ PASS: Only year_in_degree was updated, other fields unchanged!")
    else:
        print("\n❌ FAIL: Other fields were modified!")
else:
    print(f"❌ Update failed: {update_response.status_code}")
    print(update_response.text)

# Test 2: Update ONLY bio
print("\n4. Test 2: Updating ONLY bio...")
update_response2 = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={"bio": "I love computer science!"}
)

if update_response2.status_code == 200:
    updated_profile2 = update_response2.json()
    print(f"✅ Update successful!")
    print(f"   Bio: {updated_profile2.get('bio')} (should be 'I love computer science!')")
    print(f"   Year in Degree: {updated_profile2.get('year_in_degree')} (should still be 2)")
    print(f"   Full Name: {updated_profile2.get('full_name')} (should be UNCHANGED)")

    if (updated_profile2.get('bio') == "I love computer science!" and
        updated_profile2.get('year_in_degree') == 2 and
        updated_profile2.get('full_name') == current_profile.get('full_name')):
        print("\n✅ PASS: Only bio was updated!")
    else:
        print("\n❌ FAIL: Unexpected changes!")
else:
    print(f"❌ Update failed: {update_response2.status_code}")
    print(update_response2.text)

# Test 3: Update multiple fields
print("\n5. Test 3: Updating multiple fields (full_name and department_number)...")
update_response3 = requests.put(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers,
    json={
        "full_name": "New Name",
        "department_number": 999
    }
)

if update_response3.status_code == 200:
    updated_profile3 = update_response3.json()
    print(f"✅ Update successful!")
    print(f"   Full Name: {updated_profile3.get('full_name')} (should be 'New Name')")
    print(f"   Department Number: {updated_profile3.get('department_number')} (should be 999)")
    print(f"   Year in Degree: {updated_profile3.get('year_in_degree')} (should still be 2)")
    print(f"   Bio: {updated_profile3.get('bio')} (should still be 'I love computer science!')")

    if (updated_profile3.get('full_name') == "New Name" and
        updated_profile3.get('department_number') == 999 and
        updated_profile3.get('year_in_degree') == 2 and
        updated_profile3.get('bio') == "I love computer science!"):
        print("\n✅ PASS: Multiple fields updated correctly, others unchanged!")
    else:
        print("\n❌ FAIL: Unexpected changes!")
else:
    print(f"❌ Update failed: {update_response3.status_code}")
    print(update_response3.text)

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)

"""
Manual testing script for Courses API
Run this script to test the courses endpoints manually.

Usage:
    python test_courses_manual.py

Make sure the server is running on http://localhost:8000
"""
import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"

# You'll need to replace these with actual tokens
ADMIN_TOKEN = "your_admin_token_here"
USER_TOKEN = "your_user_token_here"


def print_response(response: requests.Response, title: str):
    """Pretty print API response."""
    print(f"\n{'='*60}")
    print(f"🔹 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")


def test_get_all_courses():
    """Test: Get all courses (no authentication needed)"""
    response = requests.get(f"{BASE_URL}/courses")
    print_response(response, "GET All Courses")
    return response.json() if response.status_code == 200 else []


def test_search_courses(search_term: str):
    """Test: Search courses"""
    response = requests.get(f"{BASE_URL}/courses", params={"search": search_term})
    print_response(response, f"Search Courses: '{search_term}'")


def test_filter_courses_by_department(department: str):
    """Test: Filter courses by department"""
    response = requests.get(f"{BASE_URL}/courses", params={"department": department})
    print_response(response, f"Filter by Department: '{department}'")


def test_create_course(admin_token: str):
    """Test: Create a new course (admin only)"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {
        "course_number": "TEST101",
        "course_name": "Test Course for API",
        "department": "Testing Department",
        "description": "This is a test course created by the API test script"
    }
    response = requests.post(f"{BASE_URL}/courses", json=data, headers=headers)
    print_response(response, "CREATE Course (Admin)")
    return response.json() if response.status_code == 201 else None


def test_get_course_by_id(course_id: int):
    """Test: Get course by ID"""
    response = requests.get(f"{BASE_URL}/courses/{course_id}")
    print_response(response, f"GET Course by ID: {course_id}")


def test_get_course_by_number(course_number: str):
    """Test: Get course by course number"""
    response = requests.get(f"{BASE_URL}/courses/number/{course_number}")
    print_response(response, f"GET Course by Number: {course_number}")


def test_update_course(course_id: int, admin_token: str):
    """Test: Update a course (admin only)"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {
        "course_name": "Updated Test Course Name",
        "description": "Updated description"
    }
    response = requests.put(f"{BASE_URL}/courses/{course_id}", json=data, headers=headers)
    print_response(response, f"UPDATE Course: {course_id}")


def test_enroll_in_course(course_id: int, user_token: str):
    """Test: Enroll in a course"""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.post(f"{BASE_URL}/courses/{course_id}/enroll", headers=headers)
    print_response(response, f"ENROLL in Course: {course_id}")


def test_check_enrollment(course_id: int, user_token: str):
    """Test: Check if enrolled in course"""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/courses/{course_id}/is-enrolled", headers=headers)
    print_response(response, f"CHECK Enrollment: {course_id}")


def test_get_enrolled_users(course_id: int):
    """Test: Get list of enrolled users"""
    response = requests.get(f"{BASE_URL}/courses/{course_id}/enrolled-users")
    print_response(response, f"GET Enrolled Users: {course_id}")


def test_unenroll_from_course(course_id: int, user_token: str):
    """Test: Unenroll from a course"""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.delete(f"{BASE_URL}/courses/{course_id}/enroll", headers=headers)
    print_response(response, f"UNENROLL from Course: {course_id}")


def test_get_course_statistics(course_id: int):
    """Test: Get course statistics"""
    response = requests.get(f"{BASE_URL}/courses/{course_id}/statistics")
    print_response(response, f"GET Course Statistics: {course_id}")


def test_get_my_courses(user_token: str):
    """Test: Get user's enrolled courses"""
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/courses/user/my-courses", headers=headers)
    print_response(response, "GET My Courses")


def test_get_course_materials(course_id: int):
    """Test: Get course materials"""
    response = requests.get(f"{BASE_URL}/courses/{course_id}/materials")
    print_response(response, f"GET Course Materials: {course_id}")


def test_get_course_discussions(course_id: int):
    """Test: Get course discussions"""
    response = requests.get(f"{BASE_URL}/courses/{course_id}/discussions")
    print_response(response, f"GET Course Discussions: {course_id}")


def test_delete_course(course_id: int, admin_token: str):
    """Test: Delete a course (admin only)"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.delete(f"{BASE_URL}/courses/{course_id}", headers=headers)
    print_response(response, f"DELETE Course: {course_id}")


def run_basic_tests():
    """Run basic tests that don't require authentication."""
    print("\n🚀 Starting Basic Tests (No Authentication Required)")
    print("="*70)

    # Test 1: Get all courses
    courses = test_get_all_courses()

    # Test 2: Search courses
    test_search_courses("intro")

    # Test 3: Filter by department
    test_filter_courses_by_department("Computer Science")

    # Test 4: Get course by ID (if courses exist)
    if courses and len(courses) > 0:
        test_get_course_by_id(courses[0]["id"])
        test_get_course_by_number(courses[0]["course_number"])
        test_get_course_statistics(courses[0]["id"])
        test_get_course_materials(courses[0]["id"])
        test_get_course_discussions(courses[0]["id"])


def run_authenticated_tests(user_token: str, course_id: int):
    """Run tests that require user authentication."""
    print("\n🔐 Starting Authenticated Tests (User)")
    print("="*70)

    # Test enrollment flow
    test_enroll_in_course(course_id, user_token)
    test_check_enrollment(course_id, user_token)
    test_get_my_courses(user_token)
    test_get_enrolled_users(course_id)
    test_unenroll_from_course(course_id, user_token)


def run_admin_tests(admin_token: str):
    """Run tests that require admin authentication."""
    print("\n👑 Starting Admin Tests")
    print("="*70)

    # Test CRUD operations
    created_course = test_create_course(admin_token)

    if created_course:
        course_id = created_course["id"]
        test_update_course(course_id, admin_token)
        test_get_course_by_id(course_id)
        # Uncomment to delete the test course
        # test_delete_course(course_id, admin_token)


def main():
    """Main test runner."""
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║         StudyHub - Courses API Manual Test Script         ║
    ║                                                            ║
    ║  This script tests all the courses API endpoints          ║
    ║  Make sure the server is running on localhost:8000        ║
    ╚════════════════════════════════════════════════════════════╝
    """)

    # Run basic tests (no auth required)
    try:
        run_basic_tests()
    except Exception as e:
        print(f"❌ Error in basic tests: {e}")

    # Check if tokens are provided
    if ADMIN_TOKEN != "your_admin_token_here":
        try:
            run_admin_tests(ADMIN_TOKEN)
        except Exception as e:
            print(f"❌ Error in admin tests: {e}")
    else:
        print("\n⚠️  Skipping admin tests - ADMIN_TOKEN not configured")

    if USER_TOKEN != "your_user_token_here":
        # Try to get a course ID from the basic tests
        try:
            courses = requests.get(f"{BASE_URL}/courses").json()
            if courses and len(courses) > 0:
                run_authenticated_tests(USER_TOKEN, courses[0]["id"])
            else:
                print("\n⚠️  No courses found to test enrollment")
        except Exception as e:
            print(f"❌ Error in authenticated tests: {e}")
    else:
        print("\n⚠️  Skipping authenticated tests - USER_TOKEN not configured")

    print("\n✅ Testing completed!")
    print("\n💡 To test authenticated endpoints, update ADMIN_TOKEN and USER_TOKEN")
    print("   at the top of this file with real JWT tokens.\n")


if __name__ == "__main__":
    main()

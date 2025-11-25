# Courses API Documentation

## Overview
This API provides comprehensive course management functionality including CRUD operations, enrollment management, and statistics.

## Base URL
```
/api/courses
```

## Endpoints

### 1. Create Course
**POST** `/`

Create a new course.

**Authentication:** Required

**Request Body:**
```json
{
  "course_number": "CS101",
  "course_name": "Introduction to Computer Science",
  "department": "Computer Science",
  "description": "Basic concepts of programming and algorithms"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "course_number": "CS101",
  "course_name": "Introduction to Computer Science",
  "department": "Computer Science",
  "description": "Basic concepts of programming and algorithms"
}
```

---

### 2. Get All Courses
**GET** `/`

Get list of courses with optional filters.

**Authentication:** Not required

**Query Parameters:**
- `department` (optional): Filter by department
- `search` (optional): Search in course number or name
- `skip` (optional, default: 0): Pagination offset
- `limit` (optional, default: 100): Maximum results

**Example:**
```
GET /api/courses?department=Computer%20Science&search=intro&skip=0&limit=10
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "course_number": "CS101",
    "course_name": "Introduction to Computer Science",
    "department": "Computer Science",
    "description": "Basic concepts of programming and algorithms"
  }
]
```

---

### 3. Get Course by ID
**GET** `/{course_id}`

Get a specific course by ID.

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "id": 1,
  "course_number": "CS101",
  "course_name": "Introduction to Computer Science",
  "department": "Computer Science",
  "description": "Basic concepts of programming and algorithms"
}
```

---

### 4. Get Course by Number
**GET** `/number/{course_number}`

Get a course by course number (e.g., "CS101").

**Authentication:** Not required

**Example:**
```
GET /api/courses/number/CS101
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "course_number": "CS101",
  "course_name": "Introduction to Computer Science",
  "department": "Computer Science",
  "description": "Basic concepts of programming and algorithms"
}
```

---

### 5. Update Course
**PUT** `/{course_id}`

Update a course (admin only recommended).

**Authentication:** Required

**Request Body:** (all fields optional)
```json
{
  "course_name": "Updated Course Name",
  "department": "New Department",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "course_number": "CS101",
  "course_name": "Updated Course Name",
  "department": "New Department",
  "description": "Updated description"
}
```

---

### 6. Delete Course
**DELETE** `/{course_id}`

Delete a course (admin only recommended).

**Authentication:** Required

**Note:** This will cascade delete all related materials and discussions.

**Response:** `204 No Content`

---

## Enrollment Endpoints

### 7. Enroll in Course
**POST** `/{course_id}/enroll`

Enroll the current user in a course.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Successfully enrolled in Introduction to Computer Science",
  "course_id": 1,
  "user_id": 5,
  "enrolled": true
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "User already enrolled in course Introduction to Computer Science"
}
```

---

### 8. Unenroll from Course
**DELETE** `/{course_id}/enroll`

Unenroll the current user from a course.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Successfully unenrolled from Introduction to Computer Science",
  "course_id": 1,
  "user_id": 5,
  "enrolled": false
}
```

---

### 9. Get Enrolled Users
**GET** `/{course_id}/enrolled-users`

Get list of users enrolled in a course.

**Authentication:** Not required

**Query Parameters:**
- `skip` (optional, default: 0): Pagination offset
- `limit` (optional, default: 100): Maximum results

**Response:** `200 OK`
```json
[
  {
    "user_id": 5,
    "username": "john_doe",
    "full_name": "John Doe",
    "profile_image_url": "https://example.com/profile.jpg",
    "enrolled_at": "2025-01-15T10:30:00Z"
  }
]
```

---

### 10. Check Enrollment Status
**GET** `/{course_id}/is-enrolled`

Check if the current user is enrolled in a course.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "course_id": 1,
  "user_id": 5,
  "is_enrolled": true
}
```

---

## Statistics Endpoints

### 11. Get Course Statistics
**GET** `/{course_id}/statistics`

Get detailed statistics for a course.

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "id": 1,
  "course_number": "CS101",
  "course_name": "Introduction to Computer Science",
  "department": "Computer Science",
  "description": "Basic concepts of programming and algorithms",
  "materials_count": 25,
  "discussions_count": 12,
  "enrolled_users_count": 150
}
```

---

## User Courses Endpoints

### 12. Get My Courses
**GET** `/user/my-courses`

Get all courses the current user is enrolled in.

**Authentication:** Required

**Query Parameters:**
- `skip` (optional, default: 0): Pagination offset
- `limit` (optional, default: 100): Maximum results

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "course_number": "CS101",
    "course_name": "Introduction to Computer Science",
    "department": "Computer Science",
    "description": "Basic concepts of programming and algorithms"
  }
]
```

---

## Error Responses

### Common Error Codes

- `400 Bad Request`: Invalid input or business rule violation
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Course not found
- `500 Internal Server Error`: Server error

### Example Error Response
```json
{
  "detail": "Course with id 999 not found"
}
```

---

## Database Schema

### Course Model
```python
- id: Integer (Primary Key)
- course_number: String(20) (Unique, Indexed)
- course_name: String(200)
- department: String(100) (Nullable)
- description: Text (Nullable)
```

### User-Course Enrollment (Many-to-Many)
```python
- user_id: Integer (Foreign Key -> users.id)
- course_id: Integer (Foreign Key -> courses.id)
- enrolled_at: DateTime (Auto-generated)
```

---

## Implementation Notes

1. **Enrollment Management**: Users can enroll/unenroll from courses independently
2. **Cascade Deletion**: Deleting a course will remove all related materials and discussions
3. **Search Functionality**: Case-insensitive search in both course_number and course_name
4. **Statistics**: Real-time counting of materials, discussions, and enrolled users
5. **Pagination**: All list endpoints support skip/limit parameters

---

## Testing Examples

### Using cURL

**Get all courses:**
```bash
curl -X GET "http://localhost:8000/api/courses"
```

**Create a course:**
```bash
curl -X POST "http://localhost:8000/api/courses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_number": "CS101",
    "course_name": "Introduction to Computer Science",
    "department": "Computer Science"
  }'
```

**Enroll in a course:**
```bash
curl -X POST "http://localhost:8000/api/courses/1/enroll" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get course statistics:**
```bash
curl -X GET "http://localhost:8000/api/courses/1/statistics"
```

---

## Related APIs

- **Materials API**: `/api/materials` - Manage course materials
- **Discussions API**: `/api/discussions` - Course discussion forums
- **Users API**: `/api/users` - User management

---

## Future Enhancements

- Admin role enforcement for create/update/delete operations
- Course prerequisites system
- Course ratings and reviews
- Course schedule and semester information
- Instructor assignment

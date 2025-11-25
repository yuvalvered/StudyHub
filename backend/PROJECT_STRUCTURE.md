# StudyHub Backend - Project Structure Documentation

## 📋 Overview

This document explains the complete backend structure and the role of each component.

## 🏗️ Architecture Overview

The project follows a **layered architecture** pattern:

```
Presentation Layer (Routes)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Models + Database)
```

---

## 📂 Detailed Structure

### 1. **Root Level Files**

#### `main.py`
- **Purpose**: Application entry point
- **Contains**: FastAPI app initialization, middleware setup, router registration
- **Usage**: Run with `uvicorn main:app --reload`

#### `requirements.txt`
- **Purpose**: Python dependencies
- **Install**: `pip install -r requirements.txt`

#### `.env.example`
- **Purpose**: Template for environment variables
- **Usage**: Copy to `.env` and fill in your values

#### `docker-compose.yml`
- **Purpose**: Multi-container Docker setup
- **Contains**: Database, backend, and optional Redis
- **Usage**: `docker-compose up`

#### `Dockerfile`
- **Purpose**: Backend container definition
- **Usage**: Build with `docker build -t studyhub-backend .`

#### `alembic.ini`
- **Purpose**: Alembic configuration for database migrations
- **Usage**: Configure database URL and migration settings

---

### 2. **app/core/** - Core Configuration

#### `config.py`
- Settings class using Pydantic
- Loads environment variables
- Contains all app configuration (DB, API, AI settings)

#### `security.py`
- Password hashing functions
- JWT token creation and validation
- Uses bcrypt + python-jose

#### `dependencies.py`
- FastAPI dependency injection functions
- `get_db()` - Database session
- `get_current_user()` - Authentication
- `get_current_admin_user()` - Admin authorization

---

### 3. **app/db/** - Database Layer

#### `base.py`
- SQLAlchemy declarative base
- Import point for all models (for Alembic)

#### `session.py`
- Database engine creation
- Session factory
- Connection pooling configuration

#### `init_db.py`
- Database initialization utilities
- Creates default admin user
- Can be extended for seed data

---

### 4. **app/models/** - Database Models

Each model represents a database table using SQLAlchemy ORM.

#### `user.py`
**Purpose**: User accounts and profiles
**Fields**:
- Authentication: username, email, hashed_password
- Profile: full_name, year_of_study, department, bio, profile_image
- Stats: uploads_count, downloads_received, average_rating
- Flags: is_active, is_admin, looking_for_study_partner

#### `course.py`
**Purpose**: Academic courses
**Fields**: course_number, course_name, department, description

#### `material.py`
**Purpose**: Study materials (files, summaries, exams)
**Fields**:
- Content: title, description, material_type
- File info: file_path, file_name, file_size
- Metadata: download_count, average_rating
**Types**: summary, exam, slides, notes, link, other

#### `rating.py`
**Purpose**: User ratings and reviews for materials
**Fields**: rating (1-5), comment
**Constraint**: One rating per user per material

#### `discussion.py`
**Purpose**: Forum discussions
**Fields**: title, content, is_pinned, is_locked, vote_count

#### `comment.py`
**Purpose**: Replies to discussions
**Fields**: content, upvotes, downvotes, parent_comment_id
**Feature**: Supports nested comments

#### `message.py`
**Purpose**: Direct messages between users
**Fields**: subject, content, is_read

#### `notification.py`
**Purpose**: User notifications
**Types**: new_comment, new_rating, mention, new_material, message, system

---

### 5. **app/schemas/** - Pydantic Schemas

Schemas define the shape of data for API requests and responses.

**Naming Convention**:
- `*Base` - Common fields
- `*Create` - For POST requests (input)
- `*Update` - For PUT/PATCH requests (input)
- `*Response` - For API responses (output)

#### Example: `user.py`
- `UserCreate` - Registration data (username, email, password)
- `UserUpdate` - Profile updates (optional fields)
- `UserResponse` - Public user info (no password)
- `UserProfile` - Extended profile with timestamps

---

### 6. **app/routes/** - API Endpoints

Each file contains related endpoints grouped by resource.

#### `auth.py`
- `POST /auth/register` - User registration
- `POST /auth/login` - Login (returns JWT)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Password reset

#### `users.py`
- `GET /users/me` - Current user profile
- `PUT /users/me` - Update profile
- `GET /users/{id}` - Get user by ID

#### `materials.py`
- `POST /materials` - Upload material
- `GET /materials` - List materials (with filters)
- `GET /materials/{id}` - Get material details
- `PUT /materials/{id}` - Update material
- `DELETE /materials/{id}` - Delete material
- `GET /materials/{id}/download` - Download file

#### `ai.py`
- `POST /ai/ask` - Ask AI a question (RAG-based)
- `POST /ai/summarize` - Auto-summarize document
- `POST /ai/generate-questions` - Generate practice questions

#### Other Routes (to be implemented)
- `courses.py` - Course management
- `ratings.py` - Rating and reviews
- `discussions.py` - Forum discussions
- `comments.py` - Discussion comments
- `messages.py` - Direct messaging
- `notifications.py` - User notifications
- `search.py` - Advanced search

---

### 7. **app/services/** - Business Logic

Services contain the actual implementation of features.
Routes should be thin - they just call services.

#### `auth_service.py`
- User registration logic
- Login and token generation
- Password reset flow

#### `file_service.py`
- File upload handling
- File validation
- S3 or local storage
- Virus scanning

#### `email_service.py`
- Send emails (SMTP)
- Password reset emails
- Notification emails

#### `notification_service.py`
- Create notifications
- Mark as read
- Get user notifications

#### `search_service.py`
- Material search
- Course search
- User search
- Recommendations

#### `ai/chatbot_service.py`
- Handle AI questions
- Rate limiting
- Response formatting

#### `ai/rag_service.py`
- RAG (Retrieval Augmented Generation)
- Document retrieval
- Context building

#### `ai/embeddings_service.py`
- Generate embeddings for documents
- Store in ChromaDB
- Similarity search

---

### 8. **app/utils/** - Utilities

#### `validators.py`
- File validation (size, extension)
- Input sanitization
- Helper validation functions

---

### 9. **app/middleware/** - Middleware

#### `cors.py`
- CORS configuration
- Allow frontend origins

#### `logging.py`
- Request/response logging
- Add timing headers

---

### 10. **alembic/** - Database Migrations

#### `env.py`
- Alembic environment configuration
- Imports all models
- Uses app's database URL

#### `versions/`
- Migration files (auto-generated)
- Each file represents a database change

**Common Commands**:
```bash
# Create migration
alembic revision --autogenerate -m "add users table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

### 11. **tests/** - Testing

#### `unit/`
- Test individual functions
- Mock external dependencies

#### `integration/`
- Test API endpoints
- Test with real database

#### `conftest.py`
- Pytest fixtures
- Test database setup
- Common test utilities

---

## 🔄 Request Flow Example

Example: User uploads a study material

```
1. Frontend sends POST to /api/v1/materials
   ↓
2. materials.py route receives request
   ↓
3. Route calls get_current_user (dependency)
   ↓
4. Route validates file using validators.py
   ↓
5. Route calls file_service.upload_material()
   ↓
6. Service uploads to S3/local storage
   ↓
7. Service creates Material record in database
   ↓
8. Service updates user's upload count
   ↓
9. Route returns MaterialResponse
```

---

## 🎯 Next Steps

### Immediate TODOs:
1. Implement authentication service (`auth_service.py`)
2. Implement file upload service (`file_service.py`)
3. Set up AI/RAG services
4. Create database migrations
5. Write tests
6. Implement remaining routes

### Phase 2:
- Add Redis for caching
- Implement Celery for background tasks
- Add rate limiting
- Add comprehensive logging
- Add monitoring (Sentry, etc.)

---

## 📚 Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- SQLAlchemy Docs: https://docs.sqlalchemy.org
- Alembic Tutorial: https://alembic.sqlalchemy.org
- OpenAI API: https://platform.openai.com/docs
- LangChain Docs: https://python.langchain.com

---

## 🤔 Design Decisions

### Why FastAPI?
- Automatic API documentation (Swagger)
- Built-in data validation (Pydantic)
- Async support
- Fast performance
- Great for AI/ML integration

### Why SQLAlchemy?
- Industry standard ORM
- Great for complex queries
- Type safety
- Works well with Alembic

### Why JWT?
- Stateless authentication
- Scalable
- Works across services
- Standard for REST APIs

### Why RAG for AI?
- More accurate than pure LLM
- Uses your actual study materials
- Reduces hallucinations
- Cost-effective

---

## 💡 Tips for Development

1. **Always activate virtual environment first**
   ```bash
   # Windows
   venv\Scripts\activate
   ```

2. **Run migrations after model changes**
   ```bash
   alembic revision --autogenerate -m "description"
   alembic upgrade head
   ```

3. **Use .env for secrets, never commit them**

4. **Test endpoints in Swagger UI**: http://localhost:8000/docs

5. **Check logs for debugging**

6. **Use type hints everywhere** - helps catch bugs early

---

Good luck with your project! 🚀
